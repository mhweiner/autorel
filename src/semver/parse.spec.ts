import {test} from 'hoare';
import {fromTag, getLatestVerFromTags, isValidTag, isValidVersion, toTag} from './parse';
import {SemVer} from './types';

/* eslint-disable max-lines-per-function */
test('isValidTag', (assert) => {

    assert.equal(
        isValidTag('v1.0.0'),
        true,
        'valid: stable version'
    );
    assert.equal(
        isValidTag('v3.3.2-beta.4'),
        true,
        'valid: pre-release with channel and build'
    );
    assert.equal(
        isValidTag('v3.3.2-beta'),
        true,
        'valid: pre-release with channel but no build'
    );
    assert.equal(
        isValidTag('1.0.0'),
        false,
        'invalid: version without v prefix'
    );
    assert.equal(
        isValidTag('blah'),
        false,
        'invalid: random string'
    );
    assert.equal(
        isValidTag('v3.3.2-b'),
        true,
        'invalid: pre-release with channel with invalid build'
    );
    assert.equal(
        isValidTag('v3.3.2-0'),
        true,
        'invalid: pre-release with channel and build starting with 0'
    );

});

test('toTag', (assert) => {

    assert.equal(
        toTag({major: 1, minor: 0, patch: 0}),
        'v1.0.0',
        'stable version'
    );
    assert.equal(
        toTag({major: 1, minor: 0, patch: 0, channel: 'rc', build: 1}),
        'v1.0.0-rc.1',
        'pre-release with channel and build'
    );
    assert.equal(
        toTag({major: 1, minor: 0, patch: 0, channel: 'rc'}),
        'v1.0.0-rc',
        'pre-release with channel but no build'
    );

});

test('fromTag', (assert) => {

    assert.equal(
        fromTag('v1.0.0'),
        {major: 1, minor: 0, patch: 0},
        'stable version'
    );
    assert.equal(
        fromTag('v1.0.0-rc.1'),
        {major: 1, minor: 0, patch: 0, channel: 'rc', build: 1},
        'pre-release with channel and build'
    );
    assert.equal(
        fromTag('v1.0.0-rc'),
        {major: 1, minor: 0, patch: 0, channel: 'rc', build: 1},
        'pre-release with channel but no build'
    );
    assert.equal(
        fromTag('1.0.0-rc'),
        null,
        'version without v prefix should return null'
    );
    assert.equal(
        fromTag('blah'),
        null,
        'invalid version should return null'
    );

});

test('isValidVersion: valid SemVer object should return true', (assert) => {

    const validVersions: SemVer[] = [
        {major: 1, minor: 2, patch: 3},
        {major: 0, minor: 0, patch: 0},
        {major: 1, minor: 2, patch: 3, channel: 'alpha', build: 1},
        {major: 10, minor: 20, patch: 30, channel: 'rc', build: 42},
    ];

    for (const v of validVersions) {

        assert.isTrue(isValidVersion(v), `Expected valid version: ${JSON.stringify(v)}`);

    }

});

test('isValidVersion: invalid SemVer objects should return false', (assert) => {

    const invalidVersions: SemVer[] = [
        {major: NaN, minor: 2, patch: 3},
        {major: 1, minor: NaN, patch: 3},
        {major: 1, minor: 2, patch: NaN},
        // @ts-ignore
        {major: 1, minor: 2, patch: 3, build: 'string', channel: 'beta'},
        {major: 1, minor: 2, patch: 3, channel: '@@@'}, // invalid channel for tag format
    ];

    for (const v of invalidVersions) {

        assert.equal(isValidVersion(v), false, `Expected invalid version: ${JSON.stringify(v)}`);

    }

});

test('isValidVersion: isValidVersion(x) should be equivalent to fromTag(toTag(x)) !== null', (assert) => {

    const versions: SemVer[] = [
        {major: 1, minor: 0, patch: 0},
        {major: 0, minor: 1, patch: 2, channel: 'beta', build: 5},
    ];

    for (const v of versions) {

        const expected = fromTag(toTag(v)) !== null;

        assert.equal(isValidVersion(v), expected);

    }

});

test('isValidVersion: round-trip via toTag -> fromTag should preserve structure', (assert) => {

    const version: SemVer = {major: 3, minor: 2, patch: 1, channel: 'rc', build: 7};
    const parsed = fromTag(toTag(version));

    assert.isTrue(!!parsed, 'Expected parsed version to be non-null');
    assert.equal(parsed, version);

});

test('isValidVersion: version with missing build in prerelease should still be valid', (assert) => {

    const version: SemVer = {major: 2, minor: 5, patch: 9, channel: 'canary'};

    assert.isTrue(isValidVersion(version));

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
