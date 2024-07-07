/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {mock} from 'cjs-mock';
import * as mod from './config';
import {fakeLogger} from './test_fixtures/fakeLog';
import {ValidationError, toResult} from '@aeroview-io/rtype';
import {defaultConfig} from './defaults';
import {Config} from '.';

test('getConfig: no .autorel.yaml', async (assert) => {

    const mockFs = {
        existsSync: () => false,
        readFileSync: () => {

            throw new Error('File not found'); // This should not be called

        },
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './lib/output': fakeLogger,
    });

    assert.equal(configMod.getConfig(), defaultConfig, 'should return the default configuration');

});

test('getConfig: valid .autorel.yaml', async (assert) => {

    const mockFs = {
        existsSync: () => true,
        readFileSync: () => `
            branches:
                - {name: 'main'}
                - {name: 'develop', prereleaseChannel: 'beta'}
            skipRelease: true
            publish: true
            dryRun: true
        `,
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './lib/output': fakeLogger,
    });
    const expectedConfig = {
        ...defaultConfig,
        branches: [
            {name: 'main'},
            {name: 'develop', prereleaseChannel: 'beta'},
        ],
        skipRelease: true,
        publish: true,
        dryRun: true,
    };

    assert.equal(configMod.getConfig(), expectedConfig, 'should return the parsed configuration');

});

test('getConfig: invalid configuration', async (assert) => {

    const mockFs = {
        existsSync: () => true,
        readFileSync: () => `
            breakingChange: 'BREAKING CHANGES'
            commitTypes:
              - test
              - build
        `,
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './lib/output': fakeLogger,
    });

    assert.throws(() => configMod.getConfig(), new ValidationError({
        'commitTypes.[0]': 'must be an object with keys type, title, release',
        'commitTypes.[1]': 'must be an object with keys type, title, release',
    }), 'should throw ValidationError');

});

test('getConfig: readFile error', async (assert) => {

    const mockFs = {
        existsSync: () => true,
        readFileSync: () => {

            throw new Error('something happened');

        },
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './lib/output': fakeLogger,
    });

    assert.throws(() => configMod.getConfig(), new Error('something happened'), 'should re-throw error');

});

test('getConfig: yaml error', async (assert) => {

    const invalidYaml = `
a:
  b: "This is valid
  c: "This is invalid because the string isn't closed
`;
    const mockFs = {
        existsSync: () => true,
        readFileSync: () => invalidYaml,
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './lib/output': fakeLogger,
    });

    const [err] = toResult(() => configMod.getConfig());

    assert.equal(err?.name, 'YAMLException', 'should re-throw error');

});

test('getConfig: valid .autorel.yaml with cli overrides', async (assert) => {

    const mockFs = {
        existsSync: () => true,
        readFileSync: () => `
            branches:
                - {name: 'main'}
                - {name: 'develop', prereleaseChannel: 'beta'}
        `,
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './lib/output': fakeLogger,
    });
    const cliOptions = { // all falsy values are removed
        run: 'test',
        prereleaseChannel: 'alpha',
        useVersion: '1.2.3',
        publish: true,
        skipRelease: true,
        dryRun: true,
    };
    const expectedConfig: Config = {
        ...defaultConfig,
        branches: [
            {name: 'main'},
            {name: 'develop', prereleaseChannel: 'beta'},
        ],
        run: 'test',
        prereleaseChannel: 'alpha',
        useVersion: '1.2.3',
        publish: true,
        skipRelease: true,
        dryRun: true,
    };

    assert.equal(configMod.getConfig(cliOptions), expectedConfig, 'should return the parsed configuration');

});

test('getConfig: valid .autorel.yaml with empty cli overrides (2)', async (assert) => {

    const mockFs = {
        existsSync: () => true,
        readFileSync: () => `
        commitTypes:
        - {type: feat, title: ✨ Features, release: minor}
        - {type: fix, title: 🐛 Bug Fixes, release: patch}
        - {type: perf, title: ⚡ Performance Improvements, release: patch}
        - {type: revert, title: ⏪ Reverts, release: patch}
        - {type: docs, title: 📚 Documentation, release: patch}
        - {type: style, title: 💅 Styles, release: patch}
        - {type: refactor, title: 🛠 Code Refactoring, release: patch}
        - {type: test, title: 🧪 Tests, release: patch}
        - {type: build, title: 🏗 Build System, release: patch}
        - {type: ci, title: 🔧 Continuous Integration, release: patch}
        branches:
        - {name: main}
        - {name: next, prereleaseChannel: next}
        dryRun: true
        publish: true
        `,
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './lib/output': fakeLogger,
    });
    const cliOptions = {};
    const expectedConfig: Config = {
        ...defaultConfig,
        commitTypes: [
            {type: 'feat', title: '✨ Features', release: 'minor'},
            {type: 'fix', title: '🐛 Bug Fixes', release: 'patch'},
            {
                type: 'perf',
                title: '⚡ Performance Improvements',
                release: 'patch',
            },
            {type: 'revert', title: '⏪ Reverts', release: 'patch'},
            {type: 'docs', title: '📚 Documentation', release: 'patch'},
            {type: 'style', title: '💅 Styles', release: 'patch'},
            {type: 'refactor', title: '🛠 Code Refactoring', release: 'patch'},
            {type: 'test', title: '🧪 Tests', release: 'patch'},
            {type: 'build', title: '🏗 Build System', release: 'patch'},
            {type: 'ci', title: '🔧 Continuous Integration', release: 'patch'},
        ],
        branches: [{name: 'main'}, {name: 'next', prereleaseChannel: 'next'}],
        publish: true,
        dryRun: true,
    };

    assert.equal(configMod.getConfig(cliOptions), expectedConfig, 'should return the parsed configuration');

});

