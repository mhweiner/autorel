/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {compareVersions, highestVersion} from './compare';
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
