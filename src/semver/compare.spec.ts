/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {compareVersions, latestChannelTag, latestStableTag, latestTag, highestVersion} from './compare';
import {fromTag} from './parse';

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

test('latestTag: returns undefined for empty input', (assert) => {

    assert.equal(latestTag([]), undefined);

});

test('latestTag: returns undefined if no valid tags', (assert) => {

    const tags = ['invalid', 'not-a-version', 'v1.2', 'v1.2.3.4', 'v1.2.x'];

    assert.equal(latestTag(tags), undefined);

});

test('latestTag: returns the only valid version if there is just one', (assert) => {

    assert.equal(latestTag(['v1.2.3']), 'v1.2.3');

});

test('latestTag: returns the latest version', (assert) => {


    assert.equal(
        latestTag(['v1.0.0', 'v1.2.3', 'v1.2.4', 'v0.9.9']),
        'v1.2.4'
    );
    assert.equal(
        latestTag(['v1.0.0', 'v1.2.3-beta.122', 'v1.2.4', 'v0.9.9']),
        'v1.2.4'
    );

});

test('latestTag: ignores invalid tags when computing latest', (assert) => {


    assert.equal(latestTag(['bad', 'v1.2.3', 'also-bad', 'v1.3.0']), 'v1.3.0');

});

test('latestTag: correctly handles prerelease ordering', (assert) => {


    assert.equal(
        latestTag(['v2.0.0-alpha.1', 'v2.0.0-alpha.2', 'v1.9.9']),
        'v2.0.0-alpha.2'
    );
    assert.equal(
        latestTag(['v1.0.0', 'v1.0.1', 'v1.0.2', 'v1.0.2-alpha.1']),
        'v1.0.2'
    );

});

test('latestTag: prefers stable over prerelease if it’s higher', (assert) => {


    assert.equal(
        latestTag(['v1.2.3', 'v2.0.0-beta.1', 'v2.0.0']),
        'v2.0.0'
    );

});

test('latestTag: toTag(latestTag(tags)) should return one of the original tags', (assert) => {

    const tags = ['v1.0.0', 'v1.2.0', 'v1.2.1'];

    assert.isTrue(tags.includes(latestTag(tags)!));

});

test('latestStableTag: ignores pre-releases', (assert) => {

    const tags = ['v1.0.0', 'v1.2.0', 'v1.2.1', 'v1.2.1-alpha.1', 'v2.0.0-rc.1'];

    assert.equal(latestStableTag(tags), 'v1.2.1');

});

test('latestStableTag: no results should return undefined', (assert) => {

    const tags = ['v1.0.0-rc.1'];

    assert.equal(latestStableTag(tags), undefined);

});

test('latestChannelTAg: only returns tags with specified channel', (assert) => {

    assert.equal(
        latestChannelTag(
            ['v1.0.0', 'v1.2.0', 'v1.2.1', 'v1.2.1-alpha.1', 'v2.0.0-rc.1'],
            'alpha'
        ),
        'v1.2.1-alpha.1'
    );

});

test('latestChannelTAg: no results should return undefined', (assert) => {

    const tags = ['v1.0.0-rc.1'];

    assert.equal(latestChannelTag(tags, 'alpha'), undefined);

});
