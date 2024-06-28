import {test} from 'hoare';
import {generateChangelog} from './changelog';
import {ConventionalCommit} from './conventionalcommits';
import {CommitType} from './run';

const commitTypes: CommitType[] = [
    {type: 'feat', title: 'Features', release: 'minor'},
    {type: 'fix', title: 'Bug Fixes', release: 'patch'},
    {type: 'docs', title: 'Documentation', release: 'none'},
];
const commitTypeMap = new Map(commitTypes.map((type) => [type.type, type]));

test('generateChangelog with no commits', (assert) => {

    const commits: ConventionalCommit[] = [];
    const expected = '';
    const actual = generateChangelog(commits, commitTypeMap);

    assert.equal(actual, expected);

});

test('generateChangelog with mapped titles and no breaking changes', (assert) => {

    const commits: ConventionalCommit[] = [
        {type: 'feat', description: 'Add new feature', hash: 'abc123', breaking: false, footers: []},
        {type: 'fix', description: 'Fix a bug', hash: 'def456', breaking: false, footers: []},
        {type: 'docs', description: 'Update documentation', hash: 'ghi789', breaking: false, footers: []},
    ];
    const expected =
`## Features

- Add new feature (abc123)

## Bug Fixes

- Fix a bug (def456)

## Documentation

- Update documentation (ghi789)`;
    const actual = generateChangelog(commits, commitTypeMap);

    assert.equal(actual, expected);

});

test('generateChangelog with mapped titles with breaking changes', (assert) => {

    const commits: ConventionalCommit[] = [
        {type: 'feat', description: 'Add new feature', hash: 'abc123', breaking: true, footers: []},
        {type: 'fix', description: 'Fix a bug', hash: 'def456', breaking: false, footers: []},
        {type: 'docs', description: 'Update documentation', hash: 'ghi789', breaking: false, footers: []},
    ];
    const expected =
`## Breaking Changes

- Add new feature (abc123)

## Features

- Add new feature (abc123)

## Bug Fixes

- Fix a bug (def456)

## Documentation

- Update documentation (ghi789)`;

    const actual = generateChangelog(commits, commitTypeMap);

    assert.equal(actual, expected);

});

test('generateChangelog with unmapped titles', (assert) => {

    const commits: ConventionalCommit[] = [
        {type: 'feat', description: 'Add new feature', hash: 'abc123', breaking: false, footers: []},
        {type: 'fix', description: 'Fix a bug', hash: 'def456', breaking: false, footers: []},
        {type: 'docs', description: 'Update documentation', hash: 'ghi789', breaking: false, footers: []},
    ];
    const expected =
`## feat

- Add new feature (abc123)

## fix

- Fix a bug (def456)

## docs

- Update documentation (ghi789)`;
    const actual = generateChangelog(commits, new Map());

    assert.equal(actual, expected);

});

test('generateChangelog with breaking changes and no other commits', (assert) => {

    const commits: ConventionalCommit[] = [
        {type: 'feat', description: 'Add new feature', hash: 'abc123', breaking: true, footers: []},
    ];
    const expected =
`## Breaking Changes

- Add new feature (abc123)

## Features

- Add new feature (abc123)`;
    const actual = generateChangelog(commits, commitTypeMap);

    assert.equal(actual, expected);

});

