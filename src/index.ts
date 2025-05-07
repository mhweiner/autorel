/* eslint-disable max-lines-per-function */
import * as semver from './semver';
import * as convCom from './conventionalcommits';
import * as git from './services/git';
import * as npm from './services/npm';
import {generateChangelog} from './changelog';
import * as github from './services/github';
import logger from './lib/logger';
import {updatePackageJsonVersion} from './updatePackageJsonVersion';
import {bash} from './services/sh';
import {bold, dim, greenBright, redBright, strikethrough, yellowBright} from 'colorette';

export type CommitType = {
    type: string
    title: string
    release: 'minor' | 'patch' | 'none'
};
export type ReleaseBranch = {
    name: string
    prereleaseChannel?: string
};
export type Config = {
    dryRun?: boolean
    run?: string
    preRun?: string
    runScript?: string
    prereleaseChannel?: string
    useVersion?: string
    skipRelease?: boolean
    publish?: boolean
    breakingChangeTitle: string
    commitTypes: CommitType[]
    branches: ReleaseBranch[]
};

/**
 * Determines the prerelease channel to use for the current release.
 *
 * It follows this order of precedence:
 * 1. Use `config.prereleaseChannel` if explicitly defined.
 * 2. Otherwise, detect the current git branch and look for a matching entry
 *    in `config.branches` to infer the prerelease channel.
 *
 * Returns:
 * - A string representing the prerelease channel (e.g. "alpha", "beta"), or
 * - `undefined` if no channel is configured or matched.
 *
 * Throws:
 * - If the current branch cannot be determined.
 * - If `config.branches` is undefined or empty.
 */
export function getPrereleaseChannel(config: Config): string|undefined {

    if (config.prereleaseChannel) return config.prereleaseChannel;

    const branch = git.getCurrentBranch();

    if (!branch) throw new Error('Could not get the current branch. Please make sure you are in a git repository.');
    if (!config.branches || !config.branches.length) throw new Error('Branches are not defined in the configuration. See https://github.com/mhweiner/autorel?tab=readme-ov-file#configuration');

    const matchingBranch = config.branches.find((b) => b.name === branch);

    if (!matchingBranch) return undefined;

    return matchingBranch.prereleaseChannel || undefined;

}

export async function autorel(args: Config): Promise<string|undefined> {

    const prereleaseChannel = getPrereleaseChannel(args);

    if (args.dryRun) {

        logger.warn('Running in dry-run mode. No changes will be made.');

    }

    if (prereleaseChannel && !args.useVersion) {

        const stmt = `Using prerelease channel: ${bold(prereleaseChannel)}`;

        logger.info(!args.useVersion ? stmt : strikethrough(stmt));

    } else {

        const stmt = 'This is a production release.';

        logger.info(!args.useVersion ? stmt : strikethrough(stmt));

    }

    const commitTypeMap = new Map(args.commitTypes.map((type) => [type.type, type]));

    git.gitFetchTags(); // fetch latest tags from remote

    const lastChannelTag = prereleaseChannel ? git.getLastChannelTag(prereleaseChannel) : undefined;
    const lastStableTag = git.getLastStableTag();
    const highestTag = git.getHighestTag();

    // validate tags if they exist
    if (lastChannelTag && !semver.isValidTag(lastChannelTag)) throw new Error(`Invalid last channel tag: ${lastChannelTag}`);
    if (lastStableTag && !semver.isValidTag(lastStableTag)) throw new Error(`Invalid last stable tag: ${lastStableTag}`);
    if (highestTag && !semver.isValidTag(highestTag)) throw new Error(`Invalid highest tag: ${highestTag}`);
    if (lastChannelTag && !highestTag) throw new Error('Last channel tag exists, but highest tag does not.');

    const tagFromWhichToFindCommits = prereleaseChannel && lastChannelTag
        ? semver.toTag(semver.highestVersion(
            semver.fromTag(lastChannelTag) as semver.SemVer,
            semver.fromTag(lastStableTag ?? 'v0.0.0') as semver.SemVer,
        ))
        : lastStableTag;

    !!lastChannelTag && logger.info(`The last pre-release channel version (${prereleaseChannel}) is: ${bold(lastChannelTag)}`);
    logger.info(`The last stable/production version is: ${lastStableTag ? bold(lastStableTag) : dim('none')}`);
    logger.info(`The current/highest version is: ${highestTag ? bold(highestTag) : dim('none')}`);
    logger.info(`Fetching commits since ${tagFromWhichToFindCommits ?? 'the beginning of the repository'}...`);

    const commits = git.getCommitsFromTag(tagFromWhichToFindCommits);

    logger.info(`Found ${bold(commits.length.toString())} commit(s).`);

    const parsedCommits = commits.map((commit) => convCom.parseConventionalCommit(commit.message, commit.hash))
        .filter((commit) => !!commit) as convCom.ConventionalCommit[];
    const releaseType = convCom.determineReleaseType(parsedCommits, commitTypeMap);
    const releaseTypeStr = (releaseType === 'none' && dim('none'))
            || (releaseType === 'major' && redBright('major'))
            || (releaseType === 'minor' && yellowBright('minor'))
            || (releaseType === 'patch' && greenBright('patch'));

    logger.info(`The release type is: ${releaseTypeStr}`);

    if (releaseType === 'none' && !args.useVersion) {

        logger.info('No release is needed. Have a nice day (^_^)/');
        return;

    }

    let nextTagCalculated = '';

    if (args.useVersion) {

        if (/^v(.+)$/.test(args.useVersion)) throw new Error('useVersion should not start with a "v".');
        if (!semver.isValidTag(args.useVersion)) throw new Error('useVersion must be a valid SemVer version');

        if (releaseType === 'none') {

            logger.warn(`We didn't find any commmits that would create a release, but you have set 'useVersion', which will force a release as: ${bold(args.useVersion)}.`);

        } else {

            logger.warn(`The next version was set by useVersion to be: ${bold(args.useVersion)}.`);

        }

    } else {

        nextTagCalculated = semver.toTag(semver.incrVer({
            latestVer: semver.fromTag(highestTag || 'v0.0.0') as semver.SemVer,
            latestStableVer: semver.fromTag(lastStableTag || 'v0.0.0') as semver.SemVer,
            releaseType,
            prereleaseChannel,
            latestChannelVer: lastChannelTag ? semver.fromTag(lastChannelTag) ?? undefined : undefined,
        }));

        logger.info(`The next version is: ${bold(nextTagCalculated)}`);

    }

    const nextTag = args.useVersion ? `v${args.useVersion}` : nextTagCalculated;
    const changelog = generateChangelog(parsedCommits, commitTypeMap, args.breakingChangeTitle);

    logger.debug(`The changelog is:\n${changelog}`);

    if (args.dryRun) return;

    if (args.preRun) {

        logger.info('Running pre-release bash script...');
        bash(args.preRun);

    }

    git.createAndPushTag(nextTag);

    const {owner, repository} = git.getRepo();

    !args.skipRelease && github.createRelease({
        token: process.env.GITHUB_TOKEN!,
        owner,
        repository,
        tag: nextTag,
        name: nextTag,
        body: changelog,
    });

    // publish to npm
    if (args.publish) {

        updatePackageJsonVersion(nextTag);
        npm.publishPackage(prereleaseChannel);

    }

    process.env.NEXT_VERSION = nextTag.replace('v', '');
    process.env.NEXT_TAG = nextTag;

    // run post-release bash script
    if (args.run) {

        logger.info('Running post-release bash script...');
        bash(args.run);

    } else if (args.runScript) {

        // TODO: delete this block in the next major version

        logger.warn('----------------------------');
        logger.warn('🚨 The "runScript" option is deprecated. Please use "run" instead. 🚨');
        logger.warn('🚨 The "runScript" option will be removed in the next major version. 🚨');
        logger.warn('----------------------------');

        logger.info('Running post-release bash script...');
        bash(args.runScript);

    }

    return nextTag.replace('v', '');

}

