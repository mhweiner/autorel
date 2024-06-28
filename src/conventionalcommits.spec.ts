/* eslint-disable max-lines-per-function */
import {test} from 'hoare';
import {filterBreakingCommits, determineReleaseType, parseConventionalCommit} from './conventionalcommits';
import {CommitType} from './run';

const commitTypes: CommitType[] = [
    {type: 'feat', title: 'Features', release: 'minor'},
    {type: 'fix', title: 'Bug Fixes', release: 'patch'},
    {type: 'docs', title: 'Documentation', release: 'none'},
];
const commitTypeMap = new Map(commitTypes.map((type) => [type.type, type]));

test('filterBreakingCommits', (assert) => {

    const commits = [
        {type: 'feat', description: 'Add new feature', hash: 'abc123', breaking: true, footers: []},
        {type: 'fix', description: 'Fix a bug', hash: 'def456', breaking: false, footers: []},
        {type: 'docs', description: 'Update documentation', hash: 'ghi789', breaking: false, footers: []},
    ];
    const expected = [
        {type: 'feat', description: 'Add new feature', hash: 'abc123', breaking: true, footers: []},
    ];
    const actual = filterBreakingCommits(commits);

    assert.equal(actual, expected, 'should return only breaking changes');
    assert.equal(filterBreakingCommits([]), [], 'should return an empty array when there are no breaking changes');

});

test('determineReleaseType: should return the highest release type', (assert) => {

    assert.equal(determineReleaseType([
        {type: 'feat', description: 'Add new feature', hash: 'abc123', breaking: true, footers: []},
        {type: 'fix', description: 'Fix a bug', hash: 'def456', breaking: false, footers: []},
        {type: 'docs', description: 'Update documentation', hash: 'ghi789', breaking: false, footers: []},
    ], commitTypeMap), 'major', 'highest is major');
    assert.equal(determineReleaseType([
        {type: 'feat', description: 'Add new feature', hash: 'abc123', breaking: false, footers: []},
        {type: 'fix', description: 'Fix a bug', hash: 'def456', breaking: false, footers: []},
        {type: 'docs', description: 'Update documentation', hash: 'ghi789', breaking: false, footers: []},
    ], commitTypeMap), 'minor', 'highest is minor');
    assert.equal(determineReleaseType([
        {type: 'fix', description: 'Fix a bug', hash: 'def456', breaking: false, footers: []},
        {type: 'docs', description: 'Update documentation', hash: 'ghi789', breaking: false, footers: []},
    ], commitTypeMap), 'patch', 'highest is patch');
    assert.equal(determineReleaseType([
        {type: 'docs', description: 'Update documentation', hash: 'ghi789', breaking: false, footers: []},
    ], commitTypeMap), 'none', 'highest is none');
    assert.equal(determineReleaseType([], commitTypeMap), 'none', 'should return none for no commits');
    assert.equal(determineReleaseType([
        {type: 'foo', description: 'blah', hash: 'ghi789', breaking: false, footers: []},
    ], commitTypeMap), 'none', 'should return none for unknown types');

});

test('parseConventionalCommit: breaking changes', (assert) => {

    assert.equal(
        parseConventionalCommit(
            'feat: Add new feature\n\nBREAKING CHANGE: This is a breaking change',
            'abc123'
        ),
        {
            type: 'feat',
            scope: undefined,
            description: 'Add new feature',
            body: '',
            footers: ['BREAKING CHANGE: This is a breaking change'],
            breaking: true,
            hash: 'abc123',
        },
        'BREAKING CHANGE in footer'
    );
    assert.equal(
        parseConventionalCommit(
            'feat: Add new feature\n\nBREAKING CHANGES: This is a breaking change',
            'abc123'
        ),
        {
            type: 'feat',
            scope: undefined,
            description: 'Add new feature',
            body: '',
            footers: ['BREAKING CHANGES: This is a breaking change'],
            breaking: true,
            hash: 'abc123',
        },
        'BREAKING CHANGES in footer'
    );
    assert.equal(
        parseConventionalCommit(
            'feat!: Add new feature',
            'abc123'
        ),
        {
            type: 'feat',
            scope: undefined,
            description: 'Add new feature',
            body: '',
            footers: [],
            breaking: true,
            hash: 'abc123',
        },
        'breaking change via ! without scope'
    );
    assert.equal(
        parseConventionalCommit(
            'feat(signin)!: Add new feature',
            'abc123'
        ),
        {
            type: 'feat',
            scope: 'signin',
            description: 'Add new feature',
            body: '',
            footers: [],
            breaking: true,
            hash: 'abc123',
        },
        'breaking change via ! after scope'
    );
    assert.equal(
        parseConventionalCommit(
            'feat!(signin): Add new feature',
            'abc123'
        ),
        {
            type: 'feat',
            scope: 'signin',
            description: 'Add new feature',
            body: '',
            footers: [],
            breaking: true,
            hash: 'abc123',
        },
        'breaking change via ! before scope'
    );

});

test('parseConventionalCommit: non-breaking changes', (assert) => {

    assert.equal(
        parseConventionalCommit(
            'feat: Add new feature',
            'abc123'
        ),
        {
            type: 'feat',
            scope: undefined,
            description: 'Add new feature',
            body: '',
            footers: [],
            breaking: false,
            hash: 'abc123',
        },
        'without scope, body, or footers'
    );
    assert.equal(
        parseConventionalCommit(
            'fix(signin): Fix a bug\n\nThis is a body\n\nFixes: #123',
            'abc123'
        ),
        {
            type: 'fix',
            scope: 'signin',
            description: 'Fix a bug',
            body: 'This is a body',
            footers: ['Fixes: #123'],
            breaking: false,
            hash: 'abc123',
        },
        'with scope, body, and footers'
    );
    assert.equal(
        parseConventionalCommit(
            'fix(signin): Fix a bug\n\nThis is a body\n\nStuff: multi-line\nfooter',
            'abc123'
        ),
        {
            type: 'fix',
            scope: 'signin',
            description: 'Fix a bug',
            body: 'This is a body',
            footers: ['Stuff: multi-line\nfooter'],
            breaking: false,
            hash: 'abc123',
        },
        'multi-line footer'
    );
    assert.equal(
        parseConventionalCommit(
            'foo: Fix a bug',
            'abc123'
        ),
        {
            type: 'foo',
            scope: undefined,
            description: 'Fix a bug',
            body: '',
            footers: [],
            breaking: false,
            hash: 'abc123',
        },
        'non-specified type'
    );

});

test('parseConventionalCommit: invalid commit should return undefined', (assert) => {

    assert.equal(
        parseConventionalCommit(
            'this is not a conventional commit',
            'abc123'
        ),
        undefined,
    );

});

