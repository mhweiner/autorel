/* eslint-disable max-lines-per-function */
import * as semver from './semver';
import * as convCom from './conventionalcommits';
import * as git from './lib/git';
import * as npm from './lib/npm';
import * as color from './lib/colors';
import {generateChangelog} from './changelog';
import * as github from './services/github';
import output from './lib/output';
import {getConfig} from './config';
import {versionBump} from './versionBump';

export type Args = {
    githubToken?: string
    npmToken?: string
    dryRun?: boolean
    postReleaseBashScript?: string
    prereleaseChannel?: string
    tag?: string
    noRelease?: boolean
    publish?: boolean
};

export function getPrereleaseChannel(args: Args): string|undefined {

    if (args.prereleaseChannel) return args.prereleaseChannel;

    const branch = git.getCurrentBranch();

    if (!branch) throw new Error('Could not get the current branch.');

    const config = getConfig();

    if (!config.branches || !config.branches.length) throw new Error('Branches are not defined in the configuration.');

    const matchingBranch = config.branches.find((b) => b.name === branch);

    if (!matchingBranch) throw new Error(`Branch ${branch} is not defined in the configuration.`);

    return matchingBranch.prereleaseChannel || undefined;

}

export async function autorel(args: Args): Promise<void> {

    const gitHubToken = args.githubToken || process.env.GITHUB_TOKEN;
    const npmtoken = args.npmToken || process.env.NPM_TOKEN;
    const prereleaseChannel = getPrereleaseChannel(args);

    if (!gitHubToken) {

        output.error('GitHub Token is required for creating releases. Set the GITHUB_TOKEN environment variable or pass it via --github-token.');
        throw new Error('INVALID_CONFIGURATION');

    }

    if (!npmtoken && args.publish) {

        output.error('NPM Token is required for publishing to npm. Set the NPM_TOKEN environment variable or pass it via --npm-token.');
        throw new Error('INVALID_CONFIGURATION');

    }

    if (args.dryRun) {

        output.warn('Running in dry-run mode. No changes will be made.');

    }

    if (prereleaseChannel && !args.tag) {

        output.log(`Using prerelease channel: ${color.bold(prereleaseChannel)}`);

    }

    const config = getConfig();
    const commitTypeMap = new Map(config.commitTypes.map((type) => [type.type, type]));

    const lastTag = git.getLastTag();
    const lastProdTag = git.getLastProdTag();

    output.log(`The last tag is: ${lastTag ? lastTag : color.grey('none')}`);
    output.log(`The last release tag is: ${lastProdTag ? lastProdTag : color.grey('none')}`);

    const commits = git.getCommitsSinceLastTag(lastTag);

    output.log(`Found ${color.bold(commits.length.toString())} commits ${lastTag ? `since ${lastTag}` : 'in the repository'}.`);

    const parsedCommits = commits.map((commit) => convCom.parseConventionalCommit(commit.message, commit.hash))
        .filter((commit) => !!commit) as convCom.ConventionalCommit[];
    const releaseType = convCom.determineReleaseType(parsedCommits, commitTypeMap);
    const releaseTypeStr = (releaseType === 'none' && color.grey('none'))
            || (releaseType === 'major' && color.red('major'))
            || (releaseType === 'minor' && color.yellow('minor'))
            || (releaseType === 'patch' && color.green('patch'));

    output.log(`The release type is: ${releaseTypeStr}`);

    if (releaseType === 'none' && !args.tag) {

        output.log('No release is needed. Have a nice day ^_^');

        return;

    }

    const nextTag = semver.incrementVersion(
        lastProdTag || 'v0.0.1',
        lastTag || 'v0.0.1',
        releaseType,
        prereleaseChannel,
    );

    if (args.tag) {

        output.log(`The next version would be ${nextTag}, but the tag was set by --tag to be ${color.bold(args.tag)}.`);
        output.warn('The tag was overriden by the --tag parameter. This may cause the next release to be incorrect. Make sure you know what you are doing. This may fail if the tag already exists.');

    } else {

        output.log(`The next version is: ${color.bold(nextTag)}`);

    }

    const changelog = generateChangelog(parsedCommits, commitTypeMap, config.breakingChangeTitle);

    output.debug(`The changelog is:\n${changelog}`);

    if (args.dryRun) return;

    git.createAndPushTag(args.tag ? args.tag : nextTag);

    const {owner, repository} = git.getRepoParts();

    !args.noRelease && github.createRelease({
        token: gitHubToken,
        owner,
        repository,
        tag: args.tag ? args.tag : nextTag,
        name: nextTag,
        body: changelog,
    });

    // update package.json
    versionBump(nextTag);

    // publish package
    args.publish && npm.publishPackage(gitHubToken, prereleaseChannel);

}

