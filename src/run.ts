/* eslint-disable max-lines-per-function */
import * as semver from './semver';
import * as convCom from './conventionalcommits';
import * as git from './lib/git';
import * as color from './lib/colors';
import {generateChangelog} from './changelog';
import * as github from './services/github';
import output from './lib/output';
import {getConfig} from './config';

export type ReleaseType = 'major' | 'minor' | 'patch' | 'none';
export type CommitType = {
    type: string
    title: string
    release: 'minor' | 'patch' | 'none'
};

export type Args = {
    githubToken?: string
    dryRun?: boolean
    postReleaseBashScript?: string
    prereleaseChannel?: string
    tag?: string
};

export async function run(props: Args): Promise<void> {

    const token = props.githubToken || process.env.GITHUB_TOKEN;

    if (!token) {

        output.error('GitHub Token is required for creating releases. Set the GITHUB_TOKEN environment variable or pass it in the props.');
        throw new Error('INVALID_CONFIGURATION');

    }

    if (props.dryRun) {

        output.warn('Running in dry-run mode. No changes will be made.');

    }

    if (props.prereleaseChannel && !props.tag) {

        output.log(`Using prerelease channel: ${props.prereleaseChannel}`);

    }

    const config = getConfig();
    const commitTypeMap = new Map(config.commitTypes.map((type) => [type.type, type]));

    const lastTag = git.getLastTag();
    const lastProdTag = git.getLastProdTag();

    output.log(`The last tag is: ${lastTag}`);
    output.log(`The last release tag is: ${lastProdTag}`);

    const commits = git.getCommitsSinceLastTag(lastTag);

    output.log(`Found ${commits.length} commits since the last tag.`);

    const parsedCommits = commits.map((commit) => convCom.parseConventionalCommit(commit.message, commit.hash))
        .filter((commit) => !!commit) as convCom.ConventionalCommit[];
    const releaseType = convCom.determineReleaseType(parsedCommits, commitTypeMap);
    const releaseTypeStr = (releaseType === 'none' && color.grey('none'))
            || (releaseType === 'major' && color.red('major'))
            || (releaseType === 'minor' && color.yellow('minor'))
            || (releaseType === 'patch' && color.green('patch'));

    output.log(`The release type is: ${releaseTypeStr}`);

    const nextTag = semver.incrementVersion(
        lastProdTag,
        lastTag,
        releaseType,
        props.prereleaseChannel,
    );

    if (props.tag) {

        output.log(`The next version would be ${nextTag}, but the tag was overriden by params to be: ${color.bold(props.tag)}.`);
        output.warn('The tag was overriden by the --tag parameter. This may cause the next release to be incorrect. Make sure you know what you are doing. This may fail if the tag already exists.');

    } else {

        output.log(`The next version is: ${color.bold(nextTag)}`);

    }

    const changelog = generateChangelog(parsedCommits, commitTypeMap, config.breakingChangeTitle);

    output.debug(`The changelog is:\n${changelog}`);

    if (props.dryRun) return;

    git.createAndPushTag(props.tag ? props.tag : nextTag);

    const {owner, repository} = git.getRepoParts();

    github.createRelease({
        token,
        owner,
        repository,
        tag: props.tag ? props.tag : nextTag,
        name: nextTag,
        body: changelog,
    }).catch(console.error);

}

