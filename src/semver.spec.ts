/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {incrementVersion, incrMajor, incrMinor, incrPatch, returnHighestVersion} from './semver';

test('incrementVersion: production to production', (assert) => {

    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.0', 'none'),
        'v1.0.0',
        'no changes should return the same version'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.0', 'patch'),
        'v1.0.1',
        'patch release on a production version should increment the patch version'
    );
    assert.equal(
        incrementVersion('v1.0.5', 'v1.0.5', 'patch'),
        'v1.0.6',
        'patch release on a production version should increment the patch version'
    );
    assert.equal(
        incrementVersion('v1.0.5', 'v1.0.5', 'minor'),
        'v1.1.0',
        'minor release on a production version should increment the minor version'
    );
    assert.equal(
        incrementVersion('v1.0.5', 'v1.0.5', 'major'),
        'v2.0.0',
        'major release on a production version should increment the major version and reset minor/patch'
    );

});

test('incrementVersion: production to prerelease', (assert) => {

    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.0', 'none', 'alpha'),
        'v1.0.0',
        'a no-changes prerelease should return the same version'
    );
    assert.equal(
        incrementVersion('v1.0.1', 'v1.0.1', 'patch', 'rc'),
        'v1.0.2-rc.1',
        'patch prerelease on production version should increment patch version and add prerelease channel'
    );
    assert.equal(
        incrementVersion('v1.0.1', 'v1.0.1', 'minor', 'rc'),
        'v1.1.0-rc.1',
        'minor prerelease on production version should increment minor version, reset patch, add prerelease channel'
    );
    assert.equal(
        incrementVersion('v1.0.1', 'v1.0.1', 'major', 'rc'),
        'v2.0.0-rc.1',
        'major prerelease on production version should increment major version, reset minor/patch, add prerelease channel'
    );

});

test('incrementVersion: prerelease to prerelease (same channel)', (assert) => {

    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-alpha.1', 'none', 'alpha'),
        'v1.0.1-alpha.1',
        'if no changes and the channel is the same, it should return the same version'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-rc.5', 'minor', 'rc'),
        'v1.1.0-rc.1',
        'minor prerelease on a prerelease that is patch should increment version, reset build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-rc.5', 'major', 'rc'),
        'v2.0.0-rc.1',
        'major prerelease on a prerelease that is patch should increment version, reset build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.1.0-rc.2', 'major', 'rc'),
        'v2.0.0-rc.1',
        'major prerelease on a prerelease that is minor should increment version, reset build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-rc.1', 'patch', 'rc'),
        'v1.0.1-rc.2',
        'patch prerelease on a prerelease that is already a patch should should keep version, increment build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.1.0-rc.1', 'minor', 'rc'),
        'v1.1.0-rc.2',
        'minor prerelease on a prerelease that is already a minor should should keep version, increment build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v2.0.0-rc.2', 'major', 'rc'),
        'v2.0.0-rc.3',
        'major prerelease on a prerelease that is already major should keep version, increment build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v2.0.0-rc', 'major', 'rc'),
        'v2.0.0-rc.1',
        'major prerelease on a prerelease that is already major should keep version, increment build number (default to 0)'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v2.0.0-rc.1', 'minor', 'rc'),
        'v2.0.0-rc.2',
        'minor prerelease on a prerelease that is already major should keep version, increment build number'
    );

});

test('incrementVersion: prerelease to prerelease (different channel)', (assert) => {

    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-alpha.5', 'none', 'beta'),
        'v1.0.1-beta.1',
        'if no changes but the channel is different, it should transition to the new channel and reset the build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-rc.5', 'patch', 'alpha'),
        'v1.0.1-alpha.1',
        'patch prerelease on a prerelease w/ diff channel that is patch should keep version, change channel, reset build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.1.0-rc.5', 'minor', 'alpha'),
        'v1.1.0-alpha.1',
        'minor prerelease on a prerelease w/ diff channel that is minor should keep version, change channel, reset build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v2.0.0-rc.5', 'major', 'alpha'),
        'v2.0.0-alpha.1',
        'major prerelease on a prerelease w/ diff channel that is minor should increment version, change channel, reset build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-rc.5', 'minor', 'alpha'),
        'v1.1.0-alpha.1',
        'minor prerelease on a prerelease w/ diff channel that is patch should increment version, change channel, reset build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-rc.5', 'major', 'alpha'),
        'v2.0.0-alpha.1',
        'major prerelease on a prerelease w/ diff channel that is patch should increment version, change channel, reset build number'
    );
    assert.equal(
        incrementVersion('v1.0.0', 'v2.0.0-rc.5', 'patch', 'alpha'),
        'v2.0.0-alpha.1',
        'patch prerelease on a prerelease w/ diff channel that is already major should keep version, change channel, reset build number'
    );

});

test('incrementVersion: prerelease to production', (assert) => {

    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-rc.1', 'none'),
        'v1.0.1',
        'prerelease to production should remove the prerelease'
    );

});

test('incrementVersion: invalid inputs', (assert) => {

    assert.throws(
        () => incrementVersion('v1.0.0', '1.0.0', 'none'),
        new Error('lastTag is not a valid semver tag'),
        'invalid lastTag should throw an error'
    );
    assert.throws(
        () => incrementVersion('1.0.0', 'v1.0.0', 'none'),
        new Error('lastProductionTag is not a valid semver tag'),
        'invalid lastProductionTag should throw an error'
    );
    assert.throws(
        () => incrementVersion('v1.0.1', 'v1.0.0', 'none'),
        new Error('Something must have gone wrong, as the current version is less than the last production version.\n\nTo fix this, we recommend using the --useVersion flag to specify the version you want to use.'),
        'error is thrown if lastTag is less than lastProductionTag'
    );
    assert.throws(
        () => incrementVersion('v1.1.0', 'v1.0.0', 'none'),
        new Error('Something must have gone wrong, as the current version is less than the last production version.\n\nTo fix this, we recommend using the --useVersion flag to specify the version you want to use.'),
        'error is thrown if lastTag is less than lastProductionTag'
    );
    assert.throws(
        () => incrementVersion('v2.0.0', 'v1.0.0', 'none'),
        new Error('Something must have gone wrong, as the current version is less than the last production version.\n\nTo fix this, we recommend using the --useVersion flag to specify the version you want to use.'),
        'error is thrown if lastTag is less than lastProductionTag'
    );
    assert.throws(
        () => incrementVersion('v1.0.0', 'v1.0.0-beta', 'none'),
        new Error('Something must have gone wrong, as the current version is less than the last production version.\n\nTo fix this, we recommend using the --useVersion flag to specify the version you want to use.'),
        'error is thrown if lastTag is less than lastProductionTag'
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

test('returnHighestVersion', (assert) => {

    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 0, patch: 0, channel: 'alpha', build: 2},
            {major: 1, minor: 1, patch: 0, channel: 'alpha', build: 2},
        ),
        {major: 1, minor: 1, patch: 0, channel: 'alpha', build: 2},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'beta', build: 1},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 2},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 2},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 2},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 2},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1},
            {major: 2, minor: 1, patch: 1},
        ),
        {major: 2, minor: 1, patch: 1},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1},
            {major: 1, minor: 1, patch: 1, channel: 'alpha'},
        ),
        {major: 1, minor: 1, patch: 1},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha'},
            {major: 1, minor: 1, patch: 1},
        ),
        {major: 1, minor: 1, patch: 1},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha'},
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
            {major: 1, minor: 1, patch: 1, channel: 'alpha'},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 2},
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 1},
        ),
        {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 2},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 6},
            {major: 1, minor: 1, patch: 2, channel: 'alpha', build: 6},
        ),
        {major: 1, minor: 1, patch: 2, channel: 'alpha', build: 6},
    );
    assert.equal(
        returnHighestVersion(
            {major: 1, minor: 1, patch: 2, channel: 'alpha', build: 6},
            {major: 1, minor: 1, patch: 1, channel: 'alpha', build: 6},
        ),
        {major: 1, minor: 1, patch: 2, channel: 'alpha', build: 6},
    );

});

