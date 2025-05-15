/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {mock, stub} from 'cjs-mock';
import * as m from './autorel';
import {defaultConfig} from './defaults';
import {toResultAsync} from './lib/toResult';
import {mockLogger} from './services/mockLogger';

// non-release cases

test('does not run release when releaseType is none and useVersion is undefined', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub(),
            getCommitsFromTag: stub().returns([
                {message: 'some commit that does not trigger release', hash: '123'},
            ]),
            getRepo: stub(),
            createAndPushTag: stub(),
            deleteTagFromLocalAndRemote: stub(),
        },
        github: {
            createRelease: stub(),
            deleteReleaseById: stub(),
        },
        npm: {
            publishPackage: stub(),
            unpublishPackage: stub(),
        },
        bash: stub(),
        getTags: {
            getTags: stub('getTags').expects(undefined).returns({
                highestTag: 'v1.0.0',
                highestChannelTag: '',
                highestStableTag: 'v1.0.0',
                tagFromWhichToFindCommits: 'v1.0.0',
            }),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './getPrereleaseChannel': stubs.getPrereleaseChannel,
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/sh': {bash: stubs.bash},
        './getTags': stubs.getTags,
        './services/logger': mockLogger,
    });
    const result = await mockMod.autorel({
        ...defaultConfig,
    });

    assert.equal(result, undefined, 'returns undefined');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');

    // does not call any of the following
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 0, 'does not call createAndPushTag');
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');
    assert.equal(stubs.bash.getCalls().length, 0, 'does not call bash');

});


test('does not run preRun script or do release if dryRun is set', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub(),
            getCommitsFromTag: stub().returns([
                {message: 'fix: stuff', hash: '123'},
            ]),
            getRepo: stub(),
            createAndPushTag: stub(),
            deleteTagFromLocalAndRemote: stub(),
        },
        github: {
            createRelease: stub(),
            deleteReleaseById: stub(),
        },
        npm: {
            publishPackage: stub(),
            unpublishPackage: stub(),
        },
        bash: stub(),
        getTags: {
            getTags: stub('getTags').expects(undefined).returns({
                highestTag: 'v1.0.0',
                highestChannelTag: '',
                highestStableTag: 'v1.0.0',
                tagFromWhichToFindCommits: 'v1.0.0',
            }),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './getPrereleaseChannel': stubs.getPrereleaseChannel,
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/sh': {bash: stubs.bash},
        './getTags': stubs.getTags,
        './services/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        dryRun: true,
        preRun: 'echo "hello world"',
        run: 'echo "hello world"',
    });

    assert.equal(result, undefined, 'returns undefined');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');

    // does not call any of the following
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 0, 'does not call createAndPushTag');
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');
    assert.equal(stubs.bash.getCalls().length, 0, 'does not call bash');

});


// successful releases

test('if release, creates tags, publishes to npm, creates github release w/ changelog, runs user script, and returns next version', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').expects({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
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
            $: stub(),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion').expects('1.0.2'),
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
    });

    assert.equal(result, '1.0.2', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.github.createRelease.getCalls().length, 1, 'calls createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 1, 'calls publishPackage once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out

});

test('skips github release if skipRelease=true', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').expects({}),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub().expects(undefined),
            unpublishPackage: stub(),
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
            setVersion: stub('setVersion').expects('1.0.2'),
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
        publish: true,
        skipRelease: true,
    });

    assert.equal(result, '1.0.2', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 1, 'calls publishPackage once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');

});

test('skips npm publish if publish=false (default behavior)', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').expects({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
                prerelease: false,
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage'),
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
            setVersion: stub('setVersion').expects('1.0.2'),
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
    });

    assert.equal(result, '1.0.2', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.github.createRelease.getCalls().length, 1, 'calls createRelease once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out

});

test('starts with v0.0.0 as base if no git tags', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects(undefined)
                .returns([
                    {message: 'feat: new repo', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v0.1.0'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease'),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage'),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').expects('echo "hello world"'),
            $: stub(),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: 'v0.0.0',
            }),
            setVersion: stub('setVersion').expects('0.1.0'),
        },
        getTags: {
            getTags: stub('getTags').expects(undefined).returns({
                highestTag: undefined,
                highestChannelTag: undefined,
                highestStableTag: undefined,
                tagFromWhichToFindCommits: undefined,
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
        publish: false,
        skipRelease: true,
    });

    assert.equal(result, '0.1.0', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');
    assert.equal(stubs.sh.bash.getCalls().length, 0, 'does not call bash');

});

test('runs user-defined bash script at the end of release process', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease'),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage'),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').expects('echo "hello world"'),
            $: stub(),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion').expects('1.0.2'),
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
        publish: false,
        skipRelease: true,
        runScript: 'echo "hello world"',
    });

    assert.equal(result, '1.0.2', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');

});

test('breaking commit results in returning major version', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix!: thing with breaking change', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v2.0.0'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease'),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage'),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').expects('echo "hello world"'),
            $: stub(),
        },
        packageJson: {
            read: stub('read'),
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
        publish: false,
        skipRelease: true,
        runScript: 'echo "hello world"',
    });

    assert.equal(result, '2.0.0', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');
    assert.equal(stubs.packageJson.read.getCalls().length, 0, 'does not call read');
    assert.equal(stubs.packageJson.setVersion.getCalls().length, 0, 'does not call setVersion');

});

// prereleases

test('starts with v0.0.0 as base if no git tags and prerelease channel is provided', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns('alpha')},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects(undefined)
                .returns([
                    {message: 'feat: new repo', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v0.1.0-alpha.1'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease'),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage'),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').expects('echo "hello world"'),
            $: stub(),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: 'v0.0.0',
            }),
            setVersion: stub('setVersion').expects('0.1.0-alpha.1'),
        },
        getTags: {
            getTags: stub('getTags').expects('alpha').returns({
                highestTag: undefined,
                highestChannelTag: undefined,
                highestStableTag: undefined,
                tagFromWhichToFindCommits: undefined,
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
        publish: false,
        skipRelease: true,
        prereleaseChannel: 'alpha',
    });

    assert.equal(result, '0.1.0-alpha.1', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');
    assert.equal(stubs.sh.bash.getCalls().length, 0, 'does not call bash');

});

test('release (no npm/github release) with prereleaseChannel (same channel to channel)', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns('beta')},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v2.0.0-beta.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v2.0.0-beta.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease'),
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
            read: stub('read'),
            setVersion: stub('setVersion').expects('1.0.2'),
        },
        getTags: {
            getTags: stub('getTags').expects('beta').returns({
                highestTag: 'v2.0.0-beta.1',
                highestChannelTag: 'v2.0.0-beta.1',
                highestStableTag: 'v1.0.2',
                tagFromWhichToFindCommits: 'v2.0.0-beta.1',
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
        publish: false,
        skipRelease: true,
    });

    assert.equal(result, '2.0.0-beta.2', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.packageJson.setVersion.getCalls().length, 0, 'does not call setVersion');
    assert.equal(stubs.packageJson.read.getCalls().length, 0, 'does not call read');

});

test('if release, creates tags, publishes to npm, creates github release w/ changelog, runs user script, and returns next version (prerelase)', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns('alpha')},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v1.0.2-alpha.1'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').expects({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2-alpha.1',
                name: 'v1.0.2-alpha.1',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
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
            $: stub(),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '1.0.1',
            }),
            setVersion: stub('setVersion').expects('1.0.2-alpha.1'),
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
    });

    assert.equal(result, '1.0.2-alpha.1', 'returns next version');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.github.createRelease.getCalls().length, 1, 'calls createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 1, 'calls publishPackage once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'calls bash once');

    // does not call any of the following
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 0, 'does not call deleteTagFromLocalAndRemote');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out

});

// failures

test('throws if githubToken is not present, and rolls back tag', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote').expects('v1.0.2'),
        },
        github: {
            createRelease: stub('createRelease'),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage'),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash'),
            $: stub(),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '0.0.0',
            }),
            setVersion: stub('setVersion').expects('1.0.2'),
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

    const [err] = await toResultAsync(mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        githubToken: undefined,
    }));

    assert.isTrue(err instanceof Error, 'throws error');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');

    // rollback
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 1, 'calls deleteTagFromLocalAndRemote once');

    // does not call any of the following
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 0, 'does not call deleteReleaseById');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out
    assert.equal(stubs.sh.bash.getCalls().length, 0, 'does not call bash'); // because it failed before it was called
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease'); // because it failed before it was called
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage'); // because publish is false

});

test('if npm publish fails, rolls back tag and github release', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').expects({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
                prerelease: false,
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage')
                .expects(undefined)
                .throws(new Error('npm publish failed')),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').expects('echo "hello world"'),
            $: stub(),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion').expects('1.0.2'),
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

    const [err, result] = await toResultAsync(mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        githubToken: 'GITHUB_TOKEN_TEST',
        publish: true,
    }));

    assert.equal(result, undefined, 'returns undefined because it failed');
    assert.errorsEquivalent(err, new Error('npm publish failed'), 'throws error');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.github.createRelease.getCalls().length, 1, 'calls createRelease once');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 1, 'calls publishPackage once');

    // rollback calls
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 1, 'calls deleteTagFromLocalAndRemote once');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 1, 'calls deleteReleaseById once');

    // does not call any of the following
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 0, 'does not call unpublishPackage bc it was never published');
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out
    assert.equal(stubs.sh.bash.getCalls().length, 0, 'bash is not called because of the error');

});

test('if `run` fails, rolls back tag, github release, and npm publish if', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .expects('v1.0.1')
                .returns([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').returns({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').expects('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').expects({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
                prerelease: false,
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').expects(undefined),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash')
                .expects('echo "hello world"')
                .throws(new Error('user script failed')),
            $: stub(),
        },
        packageJson: {
            read: stub('read').returns({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion').expects('1.0.2'),
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

    const [err, result] = await toResultAsync(mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        githubToken: 'GITHUB_TOKEN_TEST',
        publish: true,
    }));

    assert.equal(result, undefined, 'returns undefined because it failed');
    assert.errorsEquivalent(err, new Error('user script failed'), 'throws error');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 1, 'calls createAndPushTag once');
    assert.equal(stubs.github.createRelease.getCalls().length, 1, 'calls createRelease once');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 1, 'calls publishPackage once');
    assert.equal(stubs.sh.bash.getCalls().length, 1, 'bash is called once');

    // rollback calls
    assert.equal(stubs.git.deleteTagFromLocalAndRemote.getCalls().length, 1, 'calls deleteTagFromLocalAndRemote once');
    assert.equal(stubs.github.deleteReleaseById.getCalls().length, 1, 'calls deleteReleaseById once');
    assert.equal(stubs.npm.unpublishPackage.getCalls().length, 1, 'calls unpublishPackage once');

    // does not call any of the following
    assert.equal(stubs.sh.$.getCalls().length, 0, 'does not call $'); // because it's mocked out

});

test('aborts release if user-defined preRun script fails', async (assert) => {

    const stubs = {
        getPrereleaseChannel: {getPrereleaseChannel: stub().returns(undefined)},
        git: {
            gitFetch: stub(),
            getCommitsFromTag: stub().returns([
                {message: 'fix: bug', hash: '123'},
            ]),
            getRepo: stub(),
            createAndPushTag: stub(),
            deleteTagFromLocalAndRemote: stub(),
        },
        github: {
            createRelease: stub(),
            deleteReleaseById: stub(),
        },
        npm: {
            publishPackage: stub(),
            unpublishPackage: stub(),
        },
        sh: {
            bash: stub().throws(new Error('bash: line 1: nonexistent_command: command not found')),
            $: stub(),
        },
        getTags: {
            getTags: stub('getTags').expects(undefined).returns({
                highestTag: 'v1.0.0',
                highestChannelTag: '',
                highestStableTag: 'v1.0.0',
                tagFromWhichToFindCommits: 'v1.0.0',
            }),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './getPrereleaseChannel': stubs.getPrereleaseChannel,
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './getTags': stubs.getTags,
        './services/logger': mockLogger,
        './services/sh': stubs.sh,
    });

    const [err, result] = await toResultAsync(mockMod.autorel({
        ...defaultConfig,
        preRun: 'nonexistent_command',
    }));

    assert.isTrue(err instanceof Error, 'throws error');
    assert.equal(result, undefined, 'returns undefined');

    // calls the following only once
    assert.equal(stubs.git.gitFetch.getCalls().length, 1, 'calls gitFetch once');
    assert.equal(stubs.git.getCommitsFromTag.getCalls().length, 1, 'calls getCommitsFromTag once');

    // does not call any of the following
    assert.equal(stubs.git.createAndPushTag.getCalls().length, 0, 'does not call createAndPushTag');
    assert.equal(stubs.github.createRelease.getCalls().length, 0, 'does not call createRelease');
    assert.equal(stubs.npm.publishPackage.getCalls().length, 0, 'does not call publishPackage');

});

