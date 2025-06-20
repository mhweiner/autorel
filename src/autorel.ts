/* eslint-disable max-lines-per-function */
import * as convCom from './conventionalcommits';
import * as git from './services/git';
import * as npm from './services/npm';
import * as semver from './semver';
import * as github from './services/github';
import * as packageJson from './services/packageJson';
import {generateChangelog} from './changelog';
import logger from './services/logger';
import {bold, gray, greenBright, redBright, yellowBright} from 'colorette';
import {getPrereleaseChannel} from './getPrereleaseChannel';
import {Config, validateConfig} from '.';
import {getTags} from './getTags';
import {transaction} from './transaction';
import {bash} from './services/sh';
import {inspect} from 'node:util';
import {toResult, ValidationError} from 'typura';
import {serializeError} from 'jsout/dist/serializeError';
import {formatSerializedError} from 'jsout/dist/formatters/formatSerializedError';

const onRollback = (err: Error) => {

    logger.error(`An error occurred during release, rolling back...\n${formatSerializedError(serializeError(err))}`);

};
const onRollbackError = (err: Error) => {

    logger.error(`An error occurred during rollback:\n${formatSerializedError(serializeError(err))}`);

};

export async function autorel(args: Config): Promise<string|undefined> {

    const [validationErr] = toResult(() => validateConfig(args));

    if (validationErr instanceof ValidationError) {

        throw new Error(`Invalid configuration:\n${inspect(validationErr.messages, {depth: 5})}`);

    }

    if (args.verbose) {

        logger.info('Verbose mode is enabled.');
        process.env.AUTOREL_DEBUG = 'true';

    }

    const prereleaseChannel = getPrereleaseChannel(args);
    const isDryRun = !!args.dryRun;
    const isPrerelease = !!prereleaseChannel;

    isDryRun && logger.info('Running in dry-run mode. No changes will be made.');
    isPrerelease && logger.info(`Using prerelease channel: ${bold(prereleaseChannel)}`);
    !isPrerelease && logger.info('This is a production release.');
    !!args.useVersion && logger.info(`Will release specified version: ${bold(args.useVersion.replace('v', ''))}`);

    logger.info('-> Fetching git tags...');
    git.gitFetch();

    const {
        highestTag,
        highestChannelTag,
        highestStableTag,
        tagFromWhichToFindCommits,
    } = getTags(prereleaseChannel);

    !!highestChannelTag && logger.info(`The last pre-release channel version (${prereleaseChannel}) is: ${bold(highestChannelTag)}`);
    logger.info(`The last stable/production version is: ${highestStableTag ? bold(highestStableTag) : gray('none')}`);
    logger.info(`The current/highest version is: ${highestTag ? bold(highestTag) : gray('none')}`);

    // Fetch commits
    logger.info(`-> Fetching git commits since ${tagFromWhichToFindCommits ?? 'the beginning of the repository'}...`);
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
        ? `v${args.useVersion.replace('v', '')}`
        : semver.toTag(semver.incrVer({
            latestVer: semver.fromTag(highestTag ?? 'v0.0.0') as semver.SemVer,
            latestStableVer: semver.fromTag(highestStableTag ?? 'v0.0.0') as semver.SemVer,
            releaseType,
            prereleaseChannel,
            latestChannelVer: highestChannelTag ? semver.fromTag(highestChannelTag) : undefined,
        }));

    logger.info(`The next version is: ${bold(nextTag)}`);

    logger.info('-> Generating changelog...');
    const changelog = generateChangelog(parsedCommits, commitTypeMap, args.breakingChangeTitle);

    logger.debug(`The changelog is:\n${changelog}`);

    if (args.dryRun) {

        logger.info('🤘🎸 All done!');
        return;

    }

    // User-defined scripts for things like running tests, building the project, etc.
    if (args.preRun) {

        logger.info('-> Running pre-release bash script...');
        bash(args.preRun);

    }

    // The rest goes in a transaction so we can rollback if something goes wrong
    await transaction(async (addToRollback) => {

        git.createAndPushTag(nextTag);
        addToRollback(async () => {

            logger.info('<- Rolling back git tag...');
            git.deleteTagFromLocalAndRemote(nextTag);

        });

        // create GitHub release
        if (!args.skipRelease) {

            logger.info('-> Creating GitHub release...');
            if (!args.githubToken) throw new Error('GitHub token is required to publish a release. Please set the GITHUB_TOKEN environment variable or pass it as an argument.');

            const {owner, repository} = git.getRepo();

            const releaseId = await github.createRelease({
                token: args.githubToken,
                owner,
                repository,
                tag: nextTag,
                name: nextTag,
                body: changelog,
                prerelease: isPrerelease,
            });

            addToRollback(async () => {

                logger.info('<- Rolling back GitHub release...');
                await github.deleteReleaseById({
                    token: args.githubToken!,
                    owner,
                    repository,
                    releaseId,
                });

            });

        }

        // update package.json and publish to npm registry
        if (args.publish) {

            logger.info('-> Publishing to npm registry...');

            const oldVersion = packageJson.read().version;
            const packageName = packageJson.read().name;

            packageJson.setVersion(nextTag.replace('v', ''));

            const [publishErr] = toResult(() => npm.publishPackage(prereleaseChannel));

            packageJson.setVersion(oldVersion);

            if (publishErr) throw publishErr;

            addToRollback(async () => {

                logger.info('<- Rolling back npm publish...');
                const [rollbackErr] = toResult(() => npm.unpublishPackage(packageName, nextTag.replace('v', '')));

                if (rollbackErr) {

                    logger.error(`An error occurred during rollback:\n${formatSerializedError(serializeError(rollbackErr))}`);
                    logger.warn(`Unforunately, were unable to rollback the npm publish. You must manually unpublish the package ${packageName}@${nextTag.replace('v', '')} from the npm registry.`);

                }

            });

        }

        // set env variables to be available in the scripts
        process.env.NEXT_VERSION = nextTag.replace('v', '');
        process.env.NEXT_TAG = nextTag;

        // run user-defined release scripts
        if (args.run) {

            logger.info('-> Running release bash script...');
            bash(args.run);

        } else if (args.runScript) {

            // TODO: delete this block in the next major version
            logger.warn('🚨 Warning: The "runScript" option is deprecated. Please use "run" instead. It will be removed in the next major version.');
            logger.info('-> Running post-release bash script...');
            bash(args.runScript);

        }

        logger.info('🤘🎸 All done!');

    }, onRollback, onRollbackError);

    return nextTag.replace('v', '');

}
