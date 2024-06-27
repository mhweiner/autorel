/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {mock} from 'cjs-mock';
import * as mod from './config';
import {fakeLogger} from './test_fixtures/fakeLog';
import {ValidationError, toResult} from '@aeroview-io/rtype';

test('readAutorelYaml: happy path, with no .autorel.yaml', async (assert) => {

    const mockFs = {
        existsSync: () => false,
        readFileSync: () => {

            throw new Error('File not found'); // This should not be called

        },
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './output': fakeLogger,
    });

    assert.equal(configMod.getConfig(), mod.defaultConfig, 'should return the default configuration');

});

test('readAutorelYaml: happy path, with .autorel.yaml', async (assert) => {

    const mockFs = {
        existsSync: () => true,
        readFileSync: () => `
            breakingChangeTitle: 'BREAKING CHANGES'
            commitTypes:
              - type: 'test'
                title: '🧪 Tests'
                release: 'none'
              - type: 'build'
                title: '🏗 Build System'
                release: 'none'
        `,
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './output': fakeLogger,
    });

    assert.equal(configMod.getConfig(), {
        breakingChangeTitle: 'BREAKING CHANGES',
        commitTypes: [
            {type: 'test', title: '🧪 Tests', release: 'none'},
            {type: 'build', title: '🏗 Build System', release: 'none'},
        ],
    }, 'should return the parsed configuration from the .autorel.yaml file');

});

test('readAutorelYaml: invalid configuration', async (assert) => {

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
        './output': fakeLogger,
    });

    assert.throws(() => configMod.getConfig(), new ValidationError({
        breakingChangeTitle: 'must be a string',
        'commitTypes.[0]': 'must be an object with keys type, title, release',
        'commitTypes.[1]': 'must be an object with keys type, title, release',
    }), 'should throw ValidationError');

});

test('readAutorelYaml: readFile error', async (assert) => {

    const mockFs = {
        existsSync: () => true,
        readFileSync: () => {

            throw new Error('something happened');

        },
    };
    const configMod: typeof mod = mock('./config', {
        'node:fs': mockFs,
        'node:path': {resolve: (p: string) => p},
        './output': fakeLogger,
    });

    assert.throws(() => configMod.getConfig(), new Error('something happened'), 'should re-throw error');

});

test('readAutorelYaml: yaml error', async (assert) => {

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
        './output': fakeLogger,
    });

    const [err] = toResult(() => configMod.getConfig());

    assert.equal(err?.name, 'YAMLException', 'should re-throw error');

});
