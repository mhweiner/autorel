/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {mock, stub} from 'cjs-mock';
import * as m from './autorel';
import {autorel} from './autorel';
import {defaultConfig} from './defaults';
import {toResultAsync} from './lib/toResult';
import {mockLogger} from './services/mockLogger';

test('throws if useVersion is not valid semver', async (assert) => {

    const [err] = await toResultAsync(autorel({
        ...defaultConfig,
        useVersion: 'not-valid-semver',
    }));

    assert.isTrue(err instanceof Error, 'throws error');

});

test('useVersion accepts v prefix or not', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'some commit', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v2.2.2'),
            deleteTagFromLocalAndRemote: stub(),
        },
        github: {
            createRelease: stub('createRelease').expects({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v2.2.2',
                name: 'v2.2.2',
                body: '',
                prerelease: false,
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').expects(undefined),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').expects('echo "hello world"'),
            $: stub('$'),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
        getTags: {
            getTags: stub('getTags').expects(undefined).returns({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './getPrereleaseChannel': stubs.getPrereleaseChannel,
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': stubs.getTags,
        './services/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        githubToken: 'GITHUB_TOKEN_TEST',
        publish: true,
        useVersion: 'v2.2.2',
    });

    assert.equal(result, '2.2.2', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.github.createRelease.getCalls().length, 1, 'calls createRelease once');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 1, 'calls publishPackage once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out

});

test('publishes using useVersion even if no release is needed', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'some commit', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v2.2.2'),
            deleteTagFromLocalAndRemote: stub(),
        },
        github: {
            createRelease: stub('createRelease').expects({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v2.2.2',
                name: 'v2.2.2',
                body: '',
                prerelease: false,
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').expects(undefined),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').expects('echo "hello world"'),
            $: stub('$'),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
        getTags: {
            getTags: stub('getTags').expects(undefined).returns({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './getPrereleaseChannel': stubs.getPrereleaseChannel,
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': stubs.getTags,
        './services/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        githubToken: 'GITHUB_TOKEN_TEST',
        publish: true,
        useVersion: '2.2.2',
    });

    assert.equal(result, '2.2.2', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.github.createRelease.getCalls().length, 1, 'calls createRelease once');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 1, 'calls publishPackage once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out

});

test('publishes using useVersion even if no release is needed (prerelease)', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns('alpha')},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'some commit', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v2.2.2-alpha.1'),
            deleteTagFromLocalAndRemote: stub(),
        },
        github: {
            createRelease: stub('createRelease').expects({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v2.2.2-alpha.1',
                name: 'v2.2.2-alpha.1',
                body: '',
                prerelease: true,
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').expects('alpha'),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').expects('echo "hello world"'),
            $: stub('$'),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
        getTags: {
            getTags: stub('getTags').expects('alpha').returns({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './getPrereleaseChannel': stubs.getPrereleaseChannel,
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': stubs.getTags,
        './services/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        githubToken: 'GITHUB_TOKEN_TEST',
        publish: true,
        useVersion: '2.2.2-alpha.1',
    });

    assert.equal(result, '2.2.2-alpha.1', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.github.createRelease.getCalls().length, 1, 'calls createRelease once');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 1, 'calls publishPackage once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out

});
