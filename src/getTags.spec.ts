import {test} from 'hoare';
import {mock, stub} from 'cjs-mock';
import * as mod from './getTags'; // for typing only
import {mockLogger} from './services/mockLogger';

test('uses stable tag as base when prerelease tag exists but is lower', (assert) => {

    const tags = ['v1.0.0', 'v1.0.4-gamma.1', 'v2.0.0-beta.1', 'v2.0.0'];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags('beta');

    assert.equal(result, {
        highestTag: 'v2.0.0',
        highestStableTag: 'v2.0.0',
        highestChannelTag: 'v2.0.0-beta.1',
        tagFromWhichToFindCommits: 'v2.0.0',
    });

});

test('uses stable tag as base even when newer unrelated prerelease tag exists', (assert) => {

    const tags = ['v1.0.0', 'v1.0.4-gamma.1', 'v2.0.0-beta.1', 'v2.0.0', 'v2.0.1-alpha.1'];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags('beta');

    assert.equal(result, {
        highestTag: 'v2.0.1-alpha.1',
        highestStableTag: 'v2.0.0',
        highestChannelTag: 'v2.0.0-beta.1',
        tagFromWhichToFindCommits: 'v2.0.0',
    });

});

test('uses stable tag as base when prerelease channel is lower than stable', (assert) => {

    const tags = ['v1.0.0', 'v1.0.4-gamma.1', 'v2.0.0-beta.1', 'v2.0.0', 'v2.0.1-alpha.1'];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags('gamma');

    assert.equal(result, {
        highestTag: 'v2.0.1-alpha.1',
        highestStableTag: 'v2.0.0',
        highestChannelTag: 'v1.0.4-gamma.1',
        tagFromWhichToFindCommits: 'v2.0.0',
    });

});

test('uses highest stable tag when no prerelease channel is given', (assert) => {

    const tags = ['v1.0.0', 'v1.0.4-gamma.1', 'v2.0.0-beta.1', 'v2.0.0', 'v2.0.1-alpha.1'];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags();

    assert.equal(result, {
        highestTag: 'v2.0.1-alpha.1',
        highestStableTag: 'v2.0.0',
        highestChannelTag: undefined,
        tagFromWhichToFindCommits: 'v2.0.0',
    });

});

test('uses channel tag as base if it is higher than last stable tag', (assert) => {

    const tags = ['v1.0.0', 'v1.0.1-alpha.1'];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags('alpha');

    assert.equal(result, {
        highestTag: 'v1.0.1-alpha.1',
        highestStableTag: 'v1.0.0',
        highestChannelTag: 'v1.0.1-alpha.1',
        tagFromWhichToFindCommits: 'v1.0.1-alpha.1',
    });

});

test('uses channel tag as base if there are no stable tags', (assert) => {

    const tags = ['v1.0.1-alpha.1', 'v1.0.1-beta.1', 'v1.1.0-alpha.1', 'v1.1.0-alpha.2', 'v1.1.0-beta.1'];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags('alpha');

    assert.equal(result, {
        highestTag: 'v1.1.0-beta.1',
        highestStableTag: undefined,
        highestChannelTag: 'v1.1.0-alpha.2',
        tagFromWhichToFindCommits: 'v1.1.0-alpha.2',
    });

});

test('starts from beginning of repo if no stable tag exists and no channel tag exists', (assert) => {

    const tags = ['v0.0.1-a.1', 'v0.0.1-b.1'];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags('c');

    assert.equal(result, {
        highestTag: 'v0.0.1-b.1',
        highestStableTag: undefined,
        highestChannelTag: undefined,
        tagFromWhichToFindCommits: undefined,
    });

});

test('starts from beginning of repo if no stable tag exists is stable release', (assert) => {

    const tags = ['v0.0.1-a.1', 'v0.0.1-b.1'];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags();

    assert.equal(result, {
        highestTag: 'v0.0.1-b.1',
        highestStableTag: undefined,
        highestChannelTag: undefined,
        tagFromWhichToFindCommits: undefined,
    });

});

test('returns correct tags with only channel tags', (assert) => {

    const tags: string[] = [];
    const gitStub = {
        getRecentTags: stub().setReturnValue(tags),
    };
    const m: typeof mod = mock('./getTags', {
        './services/git': gitStub,
        './services/logger': mockLogger,
    });

    const result = m.getTags('c');

    assert.equal(result, {
        highestTag: undefined,
        highestStableTag: undefined,
        highestChannelTag: undefined,
        tagFromWhichToFindCommits: undefined,
    });

});
