/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {compareVersions, getLatestVerFromTags, highestVersion} from './compare';
import {fromTag, toTag} from './parse';

test('latestVersion', (assert) => {

    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
        'returns the same version if they are equal',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 0, patch: 0, channel: 'alpha', build: 2},
            {major: 1, minor: 1, patch: 0, channel: 'alpha', build: 2},
        ),
        {major: 1, minor: 1, patch: 0, channel: 'alpha', build: 2},
        'v1.1.0-alpha.2 should be higher than v1.0.0-alpha.2',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
        'v1.1.1-beta.1 should be higher than v1.1.1-alpha.1',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 2},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 2},
        'v1.1.1-alpha.2 should be higher than v1.1.1-alpha.1',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1},
            {major: 2, minor: 1, patch: 1},
        ),
        {major: 2, minor: 1, patch: 1},
        'v2.1.1 should be higher than v1.1.1',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1},
            {major: 1, minor: 1, patch: 1, channel: 'alpha'},
        ),
        {major: 1, minor: 1, patch: 1},
        'v1.1.1 should be higher than v1.1.1-alpha (rhs)',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha'},
            {major: 1, minor: 1, patch: 1},
        ),
        {major: 1, minor: 1, patch: 1},
        'v1.1.1 should be higher than v1.1.1-alpha (lhs)',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha'},
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
        'v1.1.1-alpha.1 should be equal to v1.1.1-alpha',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'alpha'},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
        'v1.1.1-alpha.1 should be equal to v1.1.1-alpha',
    );
    assert.equal(
        highestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 6},
            {major: 1, minor: 1, patch: 2, channel: 'alpha', build: 6},
        ),
        {major: 1, minor: 1, patch: 2, channel: 'alpha', build: 6},
        'v1.1.2-alpha.6 should be higher than v1.1.1-alpha.6',
    );

});

test('compareVersions', (assert) => {

    assert.equal(
        compareVersions(
            fromTag('v1.1.1-alpha.1')!,
            fromTag('v1.1.1-alpha.2')!,
        ),
        -1,
        'v1.1.1-alpha.2 should be higher than v1.1.1-alpha.1',
    );
    assert.equal(
        compareVersions(
            fromTag('v1.0.0-alpha.2')!,
            fromTag('v1.0.0-alpha.2')!,
        ),
        0,
        'v1.0.0-alpha.2 should be equal to v1.0.0-alpha.2',
    );
    assert.equal(
        compareVersions(
            fromTag('v1.0.0-alpha.2')!,
            fromTag('v1.0.0-alpha.1')!,
        ),
        1,
        'v1.0.0-alpha.2 should be higher than v1.0.0-alpha.1',
    );
    assert.equal(
        compareVersions(
            fromTag('v1.0.0-alpha.2')!,
            fromTag('v1.0.0-beta.1')!,
        ),
        -1,
        'v1.0.0-beta.1 should be higher than v1.0.0-alpha.2',
    );
    assert.equal(
        compareVersions(
            fromTag('v1.0.0-gamma.1')!,
            fromTag('v1.0.0-alpha.8')!,
        ),
        1,
        'v1.0.0-gamma.1 should be higher than v1.0.0-alpha.8',
    );
    assert.equal(
        compareVersions(
            fromTag('v1.0.0-alpha.2')!,
            fromTag('v1.0.0-beta')!,
        ),
        -1,
        'v1.0.0-beta should be higher than v1.0.0-alpha.2',
    );
    assert.equal(
        compareVersions(
            fromTag('v1.0.1')!,
            fromTag('v1.0.0')!,
        ),
        1,
        'v1.0.1 should be higher than v1.0.0',
    );
    assert.equal(
        compareVersions(
            fromTag('v1.0.1-alpha')!,
            fromTag('v1.0.1-alpha.1')!,
        ),
        0,
        'v1.0.1-alpha should be equal to v1.0.1-alpha.1',
    );

});

test('getLatestVerFromTags: returns null for empty input', (assert) => {

    assert.equal(getLatestVerFromTags([]), null);

});

test('getLatestVerFromTags: returns null if no valid tags', (assert) => {

    const tags = ['invalid', 'not-a-version', 'v1.2', 'v1.2.3.4', 'v1.2.x'];

    assert.equal(getLatestVerFromTags(tags), null);

});

test('getLatestVerFromTags: returns the only valid version if there is just one', (assert) => {

    const tag = 'v1.2.3';
    const expected = fromTag(tag);

    assert.equal(getLatestVerFromTags([tag]), expected);

});

test('getLatestVerFromTags: returns the latest version among valid ones', (assert) => {

    const tags = ['v1.0.0', 'v1.2.3', 'v1.2.4', 'v0.9.9'];
    const expected = fromTag('v1.2.4');

    assert.equal(getLatestVerFromTags(tags), expected);

});

test('getLatestVerFromTags: ignores invalid tags when computing latest', (assert) => {

    const tags = ['bad', 'v1.2.3', 'also-bad', 'v1.3.0'];
    const expected = fromTag('v1.3.0');

    assert.equal(getLatestVerFromTags(tags), expected);

});

test('getLatestVerFromTags: correctly handles prerelease ordering', (assert) => {

    const tags = ['v2.0.0-alpha.1', 'v2.0.0-alpha.2', 'v1.9.9'];
    const expected = fromTag('v2.0.0-alpha.2');

    assert.equal(getLatestVerFromTags(tags), expected);

});

test('getLatestVerFromTags: prefers stable over prerelease if it’s higher', (assert) => {

    const tags = ['v1.2.3', 'v2.0.0-beta.1', 'v2.0.0'];
    const expected = fromTag('v2.0.0');

    assert.equal(getLatestVerFromTags(tags), expected);

});

test('getLatestVerFromTags: toTag(getLatestVerFromTags(tags)) should return one of the original tags', (assert) => {

    const tags = ['v1.0.0', 'v1.2.0', 'v1.2.1'];
    const latest = getLatestVerFromTags(tags);
    const latestTag = toTag(latest!);

    assert.isTrue(tags.includes(latestTag), `Expected ${latestTag} to be in ${tags}`);

});
