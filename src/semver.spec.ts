/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {incrementVersion} from './semver';

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
        incrementVersion('v1.0.0', 'v1.0.1-rc.1', 'patch', 'rc'),
        'v1.0.1-rc.2',
        'patch prerelease on a prerelease that is already a patch should should keep version, increment build number'
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
        incrementVersion('v1.0.0', 'v2.0.0-rc.2', 'major', 'rc'),
        'v2.0.0-rc.3',
        'major prerelease on a prerelease that is already major should keep version, increment build number'
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

});

test('incrementVersion: prerelease to production', (assert) => {

    assert.equal(
        incrementVersion('v1.0.0', 'v1.0.1-rc.1', 'none'),
        'v1.0.1',
        'prerelease to production should remove the prerelease'
    );

});
