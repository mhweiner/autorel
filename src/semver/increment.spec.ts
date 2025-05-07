/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {incrPatch, incrMinor, incrMajor, incrVer, incrByType} from './increment';
import {errors} from './errors';
import {SemVer} from './types';
import {fromTag} from './parse';

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

test('incrByType: with "major" bumps major and resets minor/patch', (assert) => {

    const input: SemVer = {major: 1, minor: 2, patch: 3};
    const result = incrByType(input, 'major');

    assert.equal(result, {major: 2, minor: 0, patch: 0});

});

test('incrByType: with "minor" bumps minor and resets patch', (assert) => {

    const input: SemVer = {major: 1, minor: 2, patch: 3};
    const result = incrByType(input, 'minor');

    assert.equal(result, {major: 1, minor: 3, patch: 0});

});

test('incrByType: with "patch" bumps patch only', (assert) => {

    const input: SemVer = {major: 1, minor: 2, patch: 3};
    const result = incrByType(input, 'patch');

    assert.equal(result, {major: 1, minor: 2, patch: 4});

});

test('incrByType: with "none" returns input unchanged', (assert) => {

    const input: SemVer = {major: 1, minor: 2, patch: 3};
    const result = incrByType(input, 'none');

    assert.equal(result, input);

});

test('incrVer: invalid inputs', (assert) => {

    assert.throws(
        () => incrVer({
            latestVer: {major: 1, minor: 0, patch: 0},
            latestStableVer: {major: 2, minor: 0, patch: 0},
            releaseType: 'patch',
        }),
        new Error(errors.outOfOrderErr),
        'throws an error if current version is less than stable version'
    );
    assert.throws(
        () => incrVer({
            latestVer: {major: 1, minor: 0, patch: 0, channel: 'rc'},
            latestStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
        }),
        new Error(errors.outOfOrderErr),
        'throws an error if current version is less than stable version (1)'
    );
    assert.throws(
        () => incrVer({
            latestVer: {major: 1, minor: 0, patch: 0, channel: 'rc', build: 1},
            latestStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
        }),
        new Error(errors.outOfOrderErr),
        'throws an error if current version is less than stable version (2)'
    );
    assert.throws(
        () => incrVer({
            latestVer: {major: 1, minor: 0, patch: 0},
            latestStableVer: {major: 1, minor: 0, patch: 0, channel: 'rc'},
            releaseType: 'patch',
        }),
        new Error(errors.stableVerNotValid),
        'throws an error if lastStableVer is not a stable/production version'
    );
    assert.throws(
        () => incrVer({
            latestVer: {major: 2, minor: 0, patch: 0, channel: 'beta'},
            latestStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
            prereleaseChannel: 'next',
            latestChannelVer: {major: 1, minor: 0, patch: 0},
        }),
        new Error(errors.lastChannelVerNotSameChannel),
        'throws an error if lastChannelVer is not a prerelease'
    );
    assert.throws(
        () => incrVer({
            latestVer: {major: 2, minor: 0, patch: 0, channel: 'beta'},
            latestStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
            prereleaseChannel: 'next',
            latestChannelVer: {major: 2, minor: 0, patch: 0, channel: 'beta'},
        }),
        new Error(errors.lastChannelVerNotSameChannel),
        'throws an error if lastChannelVer is not a prerelease with the same channel as prereleaseChannel'
    );
    assert.throws(
        () => incrVer({
            latestVer: {major: 1, minor: 6, patch: 4, channel: 'beta'},
            latestStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
            prereleaseChannel: 'beta',
            latestChannelVer: {major: 2, minor: 0, patch: 0, channel: 'beta'},
        }),
        new Error(errors.lastChannelVerTooLarge),
        'throws an error if lastChannelVer is higher than latestVer'
    );

});

test('incrVer: no changes should throw', (assert) => {

    assert.throws(
        () => incrVer({
            latestVer: {major: 1, minor: 0, patch: 0},
            latestStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'none',
        }),
        new Error(errors.noReleaseErr),
        'no changes should return the same version'
    );

});

test('incrVer: prod to prod', (assert) => {

    assert.equal(
        incrVer({
            latestVer: {major: 1, minor: 0, patch: 0},
            latestStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
        }),
        {major: 1, minor: 0, patch: 1},
        'patch release should increment the patch version'
    );
    assert.equal(
        incrVer({
            latestVer: {major: 1, minor: 0, patch: 1},
            latestStableVer: {major: 1, minor: 0, patch: 1},
            releaseType: 'patch',
        }),
        {major: 1, minor: 0, patch: 2},
        'patch release should increment the patch version (1)'
    );
    assert.equal(
        incrVer({
            latestVer: {major: 1, minor: 0, patch: 6, channel: 'beta', build: 9},
            latestStableVer: {major: 1, minor: 0, patch: 5},
            releaseType: 'minor',
        }),
        {major: 1, minor: 1, patch: 0},
        'minor release should increment the minor version and reset patch'
    );
    assert.equal(
        incrVer({
            latestVer: {major: 1, minor: 0, patch: 6, channel: 'beta', build: 9},
            latestStableVer: {major: 1, minor: 0, patch: 5},
            releaseType: 'major',
        }),
        {major: 2, minor: 0, patch: 0},
        'major release should increment the major version and reset minor/patch'
    );

});

test('incrVer: prod to pre-release', (assert) => {

    assert.equal(
        incrVer({
            latestVer: {major: 1, minor: 0, patch: 0},
            latestStableVer: {major: 1, minor: 0, patch: 0},
            releaseType: 'patch',
            prereleaseChannel: 'alpha',
        }),
        {major: 1, minor: 0, patch: 1, channel: 'alpha', build: 1},
        'patch release should increment the patch version and add prerelease channel'
    );
    assert.equal(
        incrVer({
            latestVer: {major: 2, minor: 0, patch: 0, channel: 'alpha', build: 2},
            latestStableVer: {major: 1, minor: 0, patch: 1},
            releaseType: 'patch',
            prereleaseChannel: 'alpha',
            latestChannelVer: {major: 2, minor: 0, patch: 0, channel: 'alpha', build: 2},
        }),
        {major: 2, minor: 0, patch: 0, channel: 'alpha', build: 3},
        'should increment the build number if the last channel version conflicts with the next version'
    );
    assert.equal(
        incrVer({
            latestVer: {major: 1, minor: 0, patch: 1},
            latestStableVer: {major: 1, minor: 0, patch: 1},
            releaseType: 'patch',
            prereleaseChannel: 'alpha',
            latestChannelVer: {major: 1, minor: 0, patch: 0, channel: 'alpha'},
        }),
        {major: 1, minor: 0, patch: 2, channel: 'alpha', build: 1},
        'should NOT use the root of the last channel version if it is less than the root of the latest version'
    );
    assert.equal(
        incrVer({
            latestVer: {major: 1, minor: 2, patch: 0, channel: 'beta', build: 2},
            latestStableVer: {major: 1, minor: 0, patch: 1},
            releaseType: 'minor',
            prereleaseChannel: 'alpha',
            latestChannelVer: {major: 1, minor: 2, patch: 0, channel: 'alpha', build: 1},
        }),
        {major: 1, minor: 2, patch: 0, channel: 'alpha', build: 2},
        'allows a new release to be "less than" the latest version if it is the same root and on a different channel'
    );

});

test('incrVer: pre-release to pre-release', (assert) => {

    assert.equal(
        incrVer({
            latestVer: fromTag('v1.3.0-next.4')!,
            latestStableVer: fromTag('v1.2.2')!,
            releaseType: 'patch',
            prereleaseChannel: 'alpha',
            latestChannelVer: fromTag('v1.2.3-alpha.1')!,
        }),
        fromTag('v1.3.0-alpha.1')!,
        'pre-release root must be at >= to the latest root'
    );
    assert.equal(
        incrVer({
            latestVer: fromTag('v1.3.0-next.4')!,
            latestStableVer: fromTag('v1.2.2')!,
            releaseType: 'patch',
            prereleaseChannel: 'next',
            latestChannelVer: fromTag('v1.3.0-next.4')!,
        }),
        fromTag('v1.3.0-next.5')!,
        'should increment the build number if the last channel version conflicts with the next version'
    );
    assert.equal(
        incrVer({
            latestVer: fromTag('v1.3.0-next')!,
            latestStableVer: fromTag('v1.2.2')!,
            releaseType: 'patch',
            prereleaseChannel: 'next',
            latestChannelVer: fromTag('v1.3.0-next')!,
        }),
        fromTag('v1.3.0-next.1')!,
        'should add a build number starting at 1 if the last channel root version is the same as the new version but there is no build number'
    );

});
