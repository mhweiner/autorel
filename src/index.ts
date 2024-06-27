import * as semver from './semver';
import * as convCom from './conventionalcommits';
import * as git from './git';
import * as color from './lib/colors';
import {generateChangelog} from './changelog';
import * as github from './github';

const {GITHUB_TOKEN} = process.env;

if (!GITHUB_TOKEN) {

    console.error('The GITHUB_TOKEN environment variable is required.');
    process.exit(1);

}

export type ReleaseType = 'major' | 'minor' | 'patch' | 'none';
export type CommitType = {
    type: string
    title: string
    release: 'minor' | 'patch' | 'none'
};

const breakingTitle = '🚨 Breaking Changes 🚨';
const commitTypes: CommitType[] = [
    {type: 'feat', title: '✨ Features', release: 'minor'},
    {type: 'fix', title: '🐛 Bug Fixes', release: 'patch'},
    {type: 'perf', title: '⚡ Performance Improvements', release: 'patch'},
    {type: 'revert', title: '⏪ Reverts', release: 'patch'},
    {type: 'docs', title: '📚 Documentation', release: 'patch'},
    {type: 'style', title: '💅 Styles', release: 'patch'},
    {type: 'refactor', title: '🛠 Code Refactoring', release: 'patch'},
    {type: 'test', title: '🧪 Tests', release: 'patch'},
    {type: 'build', title: '🏗 Build System', release: 'patch'},
    {type: 'ci', title: '🔧 Continuous Integration', release: 'patch'},
];
const commitTypeMap = new Map(commitTypes.map((type) => [type.type, type]));

/*
async function main() {

    const lastTag = await getLastTag(); // v1.0.0
    const commits = await getCommitsSinceTag(lastTag); // [{type: 'feat', message: 'Add new feature'}, ...]
    const groupedCommits = groupCommits(commits); // {feat: [], fix: [], ...}
    const releaseType = getReleaseType(groupedCommits); // major, minor, patch
    const nextVersion = getNextVersion(lastTag, releaseType); // v1.1.0
    const changelog = generateChangelog(groupedCommits);

    await createTag(nextVersion);
    await createRelease(lastTag, releaseType, changelog);
    await publishPackage(releaseType);

}
*/

function parseCommits(commits: git.Commit[]): convCom.ConventionalCommit[] {

    return commits.map((commit) => convCom.parseConventionalCommit(commit.message, commit.hash))
        .filter((commit) => !!commit) as convCom.ConventionalCommit[];

}

const lastTag = git.getLastTag();
const lastProdTag = git.getLastProdTag();

console.log(`The last tag is: ${lastTag}`);
console.log(`The last production tag is: ${lastProdTag}`);

const commits = git.getCommitsSinceLastTag(lastTag);

console.log(`Found ${commits.length} commits since the last tag.`);

const parsedCommits = parseCommits(commits);
const releaseType = convCom.determineReleaseType(parsedCommits, commitTypeMap);
const releaseTypeStr = (releaseType === 'none' && color.grey('none'))
            || (releaseType === 'major' && color.red('major'))
            || (releaseType === 'minor' && color.yellow('minor'))
            || (releaseType === 'patch' && color.green('patch'));

console.log(`[autorel] The release type is: ${releaseTypeStr}`);

const nextTag = semver.incrementVersion(
    lastProdTag,
    lastTag,
    releaseType
);

console.log(`[autorel] The next version is: ${color.bold(nextTag)}`);

const changelog = generateChangelog(parsedCommits, commitTypeMap, breakingTitle);

console.log(`[autorel] The changelog is:\n${changelog}`);

git.createAndPushTag(nextTag);

const {owner, repository} = git.getRepoParts();

github.createRelease(GITHUB_TOKEN, {
    owner,
    repository,
    tagName: nextTag,
    releaseName: nextTag,
    body: changelog,
}).catch(console.error);

export function main() {

    console.log('main');

}

