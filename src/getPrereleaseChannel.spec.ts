import {test} from 'hoare';
import {getPrereleaseChannel} from './getPrereleaseChannel';
import {defaultConfig} from './defaults';
import {mock} from 'cjs-mock';
import * as mockMod from './getPrereleaseChannel';

test('returns explicit config.prereleaseChannel if defined', (assert) => {

    const config = {
        ...defaultConfig,
        prereleaseChannel: 'beta',
        branches: [],
    };
    const result = getPrereleaseChannel(config);

    assert.equal(result, 'beta');

});

test('throws if current branch cannot be determined', (assert) => {

    const m: typeof mockMod = mock('./getPrereleaseChannel', {
        './services/git': {
            getCurrentBranch: () => '',
        },
    });
    const config = {
        ...defaultConfig,
        branches: [{name: 'main', prereleaseChannel: 'alpha'}],
    };

    assert.throws(() => m.getPrereleaseChannel(config), /Could not get the current branch/);

});

test('throws if config.branches is empty', (assert) => {

    const m: typeof mockMod = mock('./getPrereleaseChannel', {
        './services/git': {
            getCurrentBranch: () => 'main',
        },
    });
    const config = {
        ...defaultConfig,
        branches: [],
    };

    assert.throws(() => m.getPrereleaseChannel(config), /Branches are not defined/);

});

test('returns undefined if branch does not match any configured branch', (assert) => {

    const m: typeof mockMod = mock('./getPrereleaseChannel', {
        './services/git': {
            getCurrentBranch: () => 'feature/cool',
        },
    });
    const config = {
        ...defaultConfig,
        branches: [{name: 'main'}],
    };

    assert.equal(m.getPrereleaseChannel(config), undefined);

});

test('returns matching prereleaseChannel from config.branches', (assert) => {

    const m: typeof mockMod = mock('./getPrereleaseChannel', {
        './services/git': {
            getCurrentBranch: () => 'develop',
        },
    });
    const config = {
        ...defaultConfig,
        branches: [{name: 'develop', prereleaseChannel: 'alpha'}],
    };

    assert.equal(m.getPrereleaseChannel(config), 'alpha');

});

test('returns undefined if matching branch has no prereleaseChannel', (assert) => {

    const m: typeof mockMod = mock('./getPrereleaseChannel', {
        './services/git': {
            getCurrentBranch: () => 'main',
        },
    });
    const config = {
        ...defaultConfig,
        branches: [{name: 'main'}],
    };

    assert.equal(m.getPrereleaseChannel(config), undefined);

});
