/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {
    incrMajor,
    incrMinor,
    incrPatch,
    highestVersion,
    incrVer,
    outOfOrderErr,
    stableVerNotValid,
    lastChannelVerNotSameChannel,
    lastChannelVerTooLarge,
    fromTag,
    toTag,
    isValidTag,
} from './semver';

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
        {major: 1, minor: 0, patch: 0, channel: 'rc'},
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

test('incrPatch', (assert) => {

    assert.equal(
        incrPatch({major: 1, minor: 0, patch: 0, channel: 'alpha', build: 2}),
        {major: 1, minor: 0, patch: 1, channel: 'alpha', build: 1},
        'should increment the patch version and reset the build number if present'
    );
    assert.equal(
        incrPatch({major: 1, minor: 0, patch: 0}),
        {major: 1, minor: 0, patch: 1},
        'should increment the patch version and omit the build number if not present'
    );

});

test('incrMinor', (assert) => {

    assert.equal(
        incrMinor({major: 1, minor: 0, patch: 0, channel: 'alpha', build: 2}),
        {major: 1, minor: 1, patch: 0, channel: 'alpha', build: 1},
        'should increment the patch version and reset the build number if present'
    );
    assert.equal(
        incrMinor({major: 1, minor: 0, patch: 0}),
        {major: 1, minor: 1, patch: 0},
        'should increment the patch version and omit the build number if not present'
    );

});

test('incrMajor', (assert) => {

    assert.equal(
        incrMajor({major: 1, minor: 0, patch: 0, channel: 'alpha', build: 2}),
        {major: 2, minor: 0, patch: 0, channel: 'alpha', build: 1},
        'should increment the major version and reset the build number if present'
    );
    assert.equal(
        incrMajor({major: 1, minor: 0, patch: 0}),
        {major: 2, minor: 0, patch: 0},
        'should increment the major version and omit the build number if not present'
    );

});

test('highestVersion', (assert) => {

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

test('incrVer: invalid inputs', (assert) => {

    assert.throws(
        () => incrVer({
            highestVer: {major: 1, minor: 0, patch: 0},
            lastStableVer: {major: 2, minor: 0, patch: 0},
            releaseType: 'patch',
        }),
        new Error(outOfOrderErr),
        'throws an error if current version is less than stable version'
    );
    assert.throws(
        () => incrVer({
            highestVer: {major: 1, minor: 0, patch: 0, channel: 'rc'},
            lastStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
        }),
        new Error(outOfOrderErr),
        'throws an error if current version is less than stable version (1)'
    );
    assert.throws(
        () => incrVer({
            highestVer: {major: 1, minor: 0, patch: 0, channel: 'rc', build: 1},
            lastStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
        }),
        new Error(outOfOrderErr),
        'throws an error if current version is less than stable version (2)'
    );
    assert.throws(
        () => incrVer({
            highestVer: {major: 1, minor: 0, patch: 0},
            lastStableVer: {major: 1, minor: 0, patch: 0, channel: 'rc'},
            releaseType: 'patch',
        }),
        new Error(stableVerNotValid),
        'throws an error if lastStableVer is not a stable/production version'
    );
    assert.throws(
        () => incrVer({
            highestVer: {major: 2, minor: 0, patch: 0, channel: 'beta'},
            lastStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
            prereleaseChannel: 'next',
            lastChannelVer: {major: 1, minor: 0, patch: 0},
        }),
        new Error(lastChannelVerNotSameChannel),
        'throws an error if lastChannelVer is not a prerelease'
    );
    assert.throws(
        () => incrVer({
            highestVer: {major: 2, minor: 0, patch: 0, channel: 'beta'},
            lastStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
            prereleaseChannel: 'next',
            lastChannelVer: {major: 2, minor: 0, patch: 0, channel: 'beta'},
        }),
        new Error(lastChannelVerNotSameChannel),
        'throws an error if lastChannelVer is not a prerelease with the same channel as prereleaseChannel'
    );
    assert.throws(
        () => incrVer({
            highestVer: {major: 1, minor: 6, patch: 4, channel: 'beta'},
            lastStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
            prereleaseChannel: 'beta',
            lastChannelVer: {major: 2, minor: 0, patch: 0, channel: 'beta'},
        }),
        new Error(lastChannelVerTooLarge),
        'throws an error if lastChannelVer is higher than highestVer'
    );

});

test('incrVer: no changes', (assert) => {

    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 0, patch: 0},
            lastStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'none',
        }),
        {major: 1, minor: 0, patch: 0},
        'no changes should return the same version'
    );
    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
            lastStableVer: {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
            releaseType: 'none',
        }),
        {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
        'no changes should return the same version (1)'
    );

});

test('incrVer: prod to prod', (assert) => {

    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 0, patch: 0},
            lastStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
        }),
        {major: 1, minor: 0, patch: 1},
        'patch release should increment the patch version'
    );
    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 0, patch: 1},
            lastStableVer: {major: 1, minor: 0, patch: 1},
            releaseType: 'patch',
        }),
        {major: 1, minor: 0, patch: 2},
        'patch release should increment the patch version (1)'
    );
    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 0, patch: 6, channel: 'beta', build: 9},
            lastStableVer: {major: 1, minor: 0, patch: 5},
            releaseType: 'minor',
        }),
        {major: 1, minor: 1, patch: 0},
        'minor release should increment the minor version and reset patch'
    );
    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 0, patch: 6, channel: 'beta', build: 9},
            lastStableVer: {major: 1, minor: 0, patch: 5},
            releaseType: 'major',
        }),
        {major: 2, minor: 0, patch: 0},
        'major release should increment the major version and reset minor/patch'
    );

});

test('incrVer: prod to pre-release', (assert) => {

    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 0, patch: 0},
            lastStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
            prereleaseChannel: 'alpha',
        }),
        {major: 1, minor: 0, patch: 1, channel: 'alpha', build: 1},
        'patch release should increment the patch version and add prerelease channel'
    );
    assert.equal(
        incrVer({
            highestVer: {major: 2, minor: 0, patch: 0, channel: 'alpha', build: 2},
            lastStableVer: {major: 1, minor: 0, patch: 1},
            releaseType: 'patch',
            prereleaseChannel: 'alpha',
            lastChannelVer: {major: 2, minor: 0, patch: 0, channel: 'alpha', build: 2},
        }),
        {major: 2, minor: 0, patch: 0, channel: 'alpha', build: 3},
        'should increment the build number if the last channel version conflicts with the next version'
    );
    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 0, patch: 1},
            lastStableVer: {major: 1, minor: 0, patch: 1},
            releaseType: 'patch',
            prereleaseChannel: 'alpha',
            lastChannelVer: {major: 1, minor: 0, patch: 0, channel: 'alpha'},
        }),
        {major: 1, minor: 0, patch: 2, channel: 'alpha', build: 1},
        'should NOT use the root of the last channel version if it is less than the root of the highest version'
    );
    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 2, patch: 0, channel: 'beta', build: 2},
            lastStableVer: {major: 1, minor: 0, patch: 1},
            releaseType: 'minor',
            prereleaseChannel: 'alpha',
            lastChannelVer: {major: 1, minor: 2, patch: 0, channel: 'alpha', build: 1},
        }),
        {major: 1, minor: 2, patch: 0, channel: 'alpha', build: 2},
        'allows a new release to be "less than" the highest version if it is the same root and on a different channel'
    );

});

test('incrVer: pre-release to pre-release', (assert) => {

    assert.equal(
        incrVer({
            highestVer: {major: 1, minor: 3, patch: 0, channel: 'next', build: 4},
            lastStableVer: {major: 1, minor: 2, patch: 2},
            releaseType: 'patch',
            prereleaseChannel: 'alpha',
            lastChannelVer: {major: 1, minor: 2, patch: 3, channel: 'alpha', build: 1},
        }),
        {major: 1, minor: 3, patch: 0, channel: 'alpha', build: 1},
        'pre-release root must be at least equal to the highest version'
    );

});

