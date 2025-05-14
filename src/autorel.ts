/* eslint-disable max-lines-per-function */
import * as convCom from './conventionalcommits';
import * as git from './services/git';
import * as npm from './services/npm';
import * as semver from './semver';
import * as github from './services/github';
import * as packageJson from './services/packageJson';
import {generateChangelog} from './changelog';
import logger from './lib/logger';
import {bold, gray, greenBright, redBright, yellowBright} from 'colorette';
import {getPrereleaseChannel} from './getPrereleaseChannel';
import {Config} from '.';
import {getTags} from './getTags';
import {isValidTag} from './semver';
import {transaction} from './lib/transaction';
import {bash} from './services/sh';

export async function autorel(args: Config): Promise<string|undefined> {

    if (args.useVersion && /^v(.+)$/.test(args.useVersion)) throw new Error('useVersion should not start with a "v".');
    if (args.useVersion && !isValidTag(`v${args.useVersion}`)) throw new Error('useVersion must be a valid SemVer version');

    const prereleaseChannel = getPrereleaseChannel(args);
    const isDryRun = !!args.dryRun;
    const isPrerelease = !!prereleaseChannel;

    isDryRun && logger.info('Running in dry-run mode. No changes will be made.');
    isPrerelease && logger.info(`Using prerelease channel: ${bold(prereleaseChannel)}`);
    !isPrerelease && logger.info('This is a production release.');
    !!args.useVersion && logger.info(`Using pinned version: ${bold(args.useVersion)}`);

    git.gitFetch();

    const {
        highestTag,
        highestChannelTag,
        highestStableTag,
        tagFromWhichToFindCommits,
    } = getTags(prereleaseChannel);
    const commits = git.getCommitsFromTag(tagFromWhichToFindCommits);

    logger.info(`Found ${bold(commits.length.toString())} commit(s).`);

    const parsedCommits = commits.map((commit) => convCom.parseConventionalCommit(commit.message, commit.hash))
        .filter((commit) => !!commit) as convCom.ConventionalCommit[];
    const commitTypeMap = new Map(args.commitTypes.map((type) => [type.type, type]));
    const releaseType = convCom.determineReleaseType(parsedCommits, commitTypeMap);
    const releaseTypeStr = (releaseType === 'none' && gray('none'))
            || (releaseType === 'major' && redBright('major'))
            || (releaseType === 'minor' && yellowBright('minor'))
            || (releaseType === 'patch' && greenBright('patch'));

    logger.info(`The release type is: ${bold(String(releaseTypeStr))}`);

    if (releaseType === 'none' && !args.useVersion) {

        logger.info('No release is needed. Have a nice day (^_^)/');
        return;

    } else if (releaseType === 'none' && args.useVersion) {

        logger.info('No release is needed. But you are using --use-version, so we will do a release anyway.');

    }

    const nextTag = args.useVersion
        ? `v${args.useVersion}`
        : semver.toTag(semver.incrVer({
            latestVer: semver.fromTag(highestTag || 'v0.0.0') as semver.SemVer,
            latestStableVer: semver.fromTag(highestStableTag || 'v0.0.0') as semver.SemVer,
            releaseType,
            prereleaseChannel,
            latestChannelVer: highestChannelTag ? semver.fromTag(highestChannelTag) ?? undefined : undefined,
        }));
    const changelog = generateChangelog(parsedCommits, commitTypeMap, args.breakingChangeTitle);

    logger.info(`The next version is: ${bold(nextTag)}`);
    logger.debug(`The changelog is:\n${changelog}`);

    if (args.dryRun) return;

    // User-defined scripts for things like running tests, building the project, etc.
    if (args.preRun) {

        logger.info('Running pre-release bash script...');
        bash(args.preRun);

    }

    // The rest goes in a transaction so we can rollback if something goes wrong
    await transaction(async (addToRollback) => {

        git.createAndPushTag(nextTag);
        addToRollback(async () => {

            logger.info('Rolling back git tag...');
            git.deleteTagFromLocalAndRemote(nextTag);

        });

        // create GitHub release
        if (!args.skipRelease) {

            if (!args.gitHubToken) throw new Error('GitHub token is required to publish a release. Please set the GITHUB_TOKEN environment variable or pass it as an argument.');

            const {owner, repository} = git.getRepo();

            const releaseId = await github.createRelease({
                token: args.gitHubToken,
                owner,
                repository,
                tag: nextTag,
                name: nextTag,
                body: changelog,
            });

            addToRollback(async () => {

                logger.info('Rolling back GitHub release...');
                await github.deleteReleaseById({
                    token: process.env.GITHUB_TOKEN!,
                    owner,
                    repository,
                    releaseId,
                });

            });

        }

        // update package.json and publish to npm registry
        if (args.publish) {

            const oldVersion = packageJson.read().version;

            packageJson.setVersion(nextTag);
            addToRollback(async () => {

                logger.info('Rolling back package.json...');
                packageJson.setVersion(oldVersion);

            });

            npm.publishPackage(prereleaseChannel);
            addToRollback(async () => {

                logger.info('Rolling back npm publish...');
                await npm.unpublishPackage(`${packageJson.read().name}@${nextTag}`);

            });

        }

        // set env variables to be available in the scripts
        process.env.NEXT_VERSION = nextTag.replace('v', '');
        process.env.NEXT_TAG = nextTag;

        // run user-defined release scripts
        if (args.run) {

            logger.info('Running release bash script...');
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

    });

    return nextTag.replace('v', '');

}
