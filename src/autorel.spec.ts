/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {mock, stub} from 'cjs-mock';
import * as m from './autorel';
import {autorel} from './autorel';
import {defaultConfig} from './defaults';
import {toResultAsync} from './lib/toResult';
import {mockLogger} from './lib/mockLogger';

test('throws if useVersion starts with v or not valid semver', async (assert) => {

    const [err] = await toResultAsync(autorel({
        ...defaultConfig,
        useVersion: 'v1.0.0',
    }));

    assert.isTrue(err instanceof Error, 'throws error');

    const [err2] = await toResultAsync(autorel({
        ...defaultConfig,
        useVersion: 'not-valid-semver',
    }));

    assert.isTrue(err2 instanceof Error, 'throws error');

});

test('does not run release when releaseType is none and useVersion is undefined', async (assert) => {

    const stubs = {
        git: {
            gitFetch: stub(),
            getCommitsFromTag: stub().setReturnValue([
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
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/sh': {bash: stubs.bash},
        './getTags': {
            getTags: () => ({
                highestTag: 'v1.0.0',
                highestChannelTag: '',
                highestStableTag: 'v1.0.0',
                tagFromWhichToFindCommits: 'v1.0.0',
            }),
        },
        './lib/logger': mockLogger,
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

test('if release, creates tags, publishes to npm, creates github release w/ changelog, runs user script, and returns next version', async (assert) => {

    const stubs = {
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .setExpectedArgs('v1.0.1')
                .setReturnValue([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').setReturnValue({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').setExpectedArgs('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').setExpectedArgs({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').setExpectedArgs(undefined),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').setExpectedArgs('echo "hello world"'),
            $: stub(),
        },
        packageJson: {
            read: stub('read').setReturnValue({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': {
            getTags: () => ({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
        './lib/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        gitHubToken: 'GITHUB_TOKEN_TEST',
        publish: true,
    });

    assert.equal(result, '1.0.2', 'returns next version');

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

test('skips github release if skipRelease=true', async (assert) => {

    const stubs = {
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .setExpectedArgs('v1.0.1')
                .setReturnValue([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').setReturnValue({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').setExpectedArgs('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').setExpectedArgs({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub().setExpectedArgs(undefined),
            unpublishPackage: stub(),
        },
        sh: {
            bash: stub('bash').setExpectedArgs('echo "hello world"'),
            $: stub('$'),
        },
        packageJson: {
            read: stub('read').setReturnValue({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': {
            getTags: () => ({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
        './lib/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        gitHubToken: 'GITHUB_TOKEN_TEST',
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
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .setExpectedArgs('v1.0.1')
                .setReturnValue([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').setReturnValue({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').setExpectedArgs('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').setExpectedArgs({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage'),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').setExpectedArgs('echo "hello world"'),
            $: stub('$'),
        },
        packageJson: {
            read: stub('read').setReturnValue({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': {
            getTags: () => ({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
        './lib/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        gitHubToken: 'GITHUB_TOKEN_TEST',
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

test('publishes using useVersion even if no commits are needed', async (assert) => {

    const stubs = {
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .setExpectedArgs('v1.0.1')
                .setReturnValue([
                    {message: 'some commit', hash: '123'},
                ]),
            getRepo: stub('getRepo').setReturnValue({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').setExpectedArgs('v2.2.2'),
            deleteTagFromLocalAndRemote: stub(),
        },
        github: {
            createRelease: stub('createRelease').setExpectedArgs({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v2.2.2',
                name: 'v2.2.2',
                body: '',
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').setExpectedArgs(undefined),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').setExpectedArgs('echo "hello world"'),
            $: stub('$'),
        },
        packageJson: {
            read: stub('read').setReturnValue({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': {
            getTags: () => ({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
        './lib/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        gitHubToken: 'GITHUB_TOKEN_TEST',
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

test('publishes using useVersion even if no commits are needed (prerelease)', async (assert) => {

    const stubs = {
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .setExpectedArgs('v1.0.1')
                .setReturnValue([
                    {message: 'some commit', hash: '123'},
                ]),
            getRepo: stub('getRepo').setReturnValue({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').setExpectedArgs('v2.2.2-alpha.1'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').setExpectedArgs({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v2.2.2-alpha.1',
                name: 'v2.2.2-alpha.1',
                body: '',
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').setExpectedArgs('dev'),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').setExpectedArgs('echo "hello world"'),
            $: stub('$'),
        },
        packageJson: {
            read: stub('read').setReturnValue({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': {
            getTags: () => ({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
        './lib/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        gitHubToken: 'GITHUB_TOKEN_TEST',
        publish: true,
        useVersion: '2.2.2-alpha.1',
        prereleaseChannel: 'dev',
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

test('release (no npm/github release) with prereleaseChannel, on the correct branch', async (assert) => {

    const stubs = {
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .setExpectedArgs('v2.0.0-beta.1')
                .setReturnValue([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').setReturnValue({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').setExpectedArgs('v2.0.0-beta.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease'),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').setExpectedArgs(undefined),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').setExpectedArgs('echo "hello world"'),
            $: stub('$'),
        },
        packageJson: {
            read: stub('read'),
            setVersion: stub('setVersion'),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': {
            getTags: () => ({
                highestTag: 'v2.0.0-beta.1',
                highestChannelTag: 'v2.0.0-beta.1',
                highestStableTag: 'v1.0.2',
                tagFromWhichToFindCommits: 'v2.0.0-beta.1',
            }),
        },
        './lib/logger': mockLogger,
    });

    const result = await mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        publish: false,
        skipRelease: true,
        prereleaseChannel: 'beta',
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

test('rolls back tag and github release if npm publish fails', async (assert) => {

    const stubs = {
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .setExpectedArgs('v1.0.1')
                .setReturnValue([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').setReturnValue({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').setExpectedArgs('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').setExpectedArgs({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage')
                .setExpectedArgs(undefined)
                .throws(new Error('npm publish failed')),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash').setExpectedArgs('echo "hello world"'),
            $: stub(),
        },
        packageJson: {
            read: stub('read').setReturnValue({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': {
            getTags: () => ({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
        './lib/logger': mockLogger,
    });

    const [err, result] = await toResultAsync(mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        gitHubToken: 'GITHUB_TOKEN_TEST',
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

test('rolls back tag, github release, and npm publish if user script fails', async (assert) => {

    const stubs = {
        git: {
            gitFetch: stub('gitFetch'),
            getCommitsFromTag: stub('getCommitsFromTag')
                .setExpectedArgs('v1.0.1')
                .setReturnValue([
                    {message: 'fix: thing', hash: '123'},
                ]),
            getRepo: stub('getRepo').setReturnValue({owner: 'owner', repository: 'repo'}),
            createAndPushTag: stub('createAndPushTag').setExpectedArgs('v1.0.2'),
            deleteTagFromLocalAndRemote: stub('deleteTagFromLocalAndRemote'),
        },
        github: {
            createRelease: stub('createRelease').setExpectedArgs({
                token: 'GITHUB_TOKEN_TEST',
                owner: 'owner',
                repository: 'repo',
                tag: 'v1.0.2',
                name: 'v1.0.2',
                body: '## 🐛 Bug Fixes\n\n- thing (123)',
            }),
            deleteReleaseById: stub('deleteReleaseById'),
        },
        npm: {
            publishPackage: stub('publishPackage').setExpectedArgs(undefined),
            unpublishPackage: stub('unpublishPackage'),
        },
        sh: {
            bash: stub('bash')
                .setExpectedArgs('echo "hello world"')
                .throws(new Error('user script failed')),
            $: stub(),
        },
        packageJson: {
            read: stub('read').setReturnValue({
                name: 'test',
                version: '1.0.0',
            }),
            setVersion: stub('setVersion'),
        },
    };
    const mockMod: typeof m = mock('./autorel', {
        './services/git': stubs.git,
        './services/github': stubs.github,
        './services/npm': stubs.npm,
        './services/packageJson': stubs.packageJson,
        './services/sh': stubs.sh,
        './getTags': {
            getTags: () => ({
                highestTag: 'v1.0.1',
                highestChannelTag: undefined,
                highestStableTag: 'v1.0.1',
                tagFromWhichToFindCommits: 'v1.0.1',
            }),
        },
        './lib/logger': mockLogger,
    });

    const [err, result] = await toResultAsync(mockMod.autorel({
        ...defaultConfig,
        run: 'echo "hello world"',
        gitHubToken: 'GITHUB_TOKEN_TEST',
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
