import {test} from 'kizu';
import {getPrereleaseChannel} from './getPrereleaseChannel';
import {defaultConfig} from './defaults';
import {mock} from 'cjs-mock';
import * as mockMod from './getPrereleaseChannel';

test('returns config.preRelease if defined (ie, "beta", null, false, etc.)', (assert) => {

    assert.equal(getPrereleaseChannel({
        ...defaultConfig,
        preRelease: 'beta',
    }), 'beta', 'returns preRelease from config.preRelease');
    assert.equal(getPrereleaseChannel({
        ...defaultConfig,
        preRelease: null,
    }), undefined, 'returns preRelease from config.preRelease');
    assert.equal(getPrereleaseChannel({
        ...defaultConfig,
        preRelease: false,
    }), undefined, 'returns preRelease from config.preRelease');

});

test('returns channel from config.useVersion if defined, overriding config.preRelease', (assert) => {

    assert.equal(getPrereleaseChannel({
        ...defaultConfig,
        preRelease: 'beta',
        branches: [],
        useVersion: '1.2.3-alpha.1',
    }), 'alpha');
    assert.equal(getPrereleaseChannel({
        ...defaultConfig,
        preRelease: 'beta',
        branches: [],
        useVersion: 'v1.2.3-dev.1',
    }), 'dev');
    assert.equal(getPrereleaseChannel({
        ...defaultConfig,
        branches: [],
        useVersion: 'v1.2.3-delta.1',
    }), 'delta');

});

test('throws if current branch cannot be determined', (assert) => {

    const m: typeof mockMod = mock('./getPrereleaseChannel', {
        './services/git': {
            getCurrentBranch: () => '',
        },
    });
    const config = {
        ...defaultConfig,
        branches: [{name: 'main', preRelease: 'alpha'}],
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

test('returns matching preRelease from config.branches', (assert) => {

    const m: typeof mockMod = mock('./getPrereleaseChannel', {
        './services/git': {
            getCurrentBranch: () => 'develop',
        },
    });
    const config = {
        ...defaultConfig,
        branches: [{name: 'develop', preRelease: 'alpha'}],
    };

    assert.equal(m.getPrereleaseChannel(config), 'alpha');

});

test('returns undefined if matching branch has no preRelease', (assert) => {

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
