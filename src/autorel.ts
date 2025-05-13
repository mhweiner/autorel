/* eslint-disable max-lines-per-function */
import * as convCom from './conventionalcommits';
import * as git from './services/git';
import * as npm from './services/npm';
import {generateChangelog} from './changelog';
import logger from './lib/logger';
import {updatePackageJsonVersion} from './updatePackageJsonVersion';
import {bold, gray, greenBright, redBright, yellowBright} from 'colorette';
import {getPrereleaseChannel} from './getPrereleaseChannel';
import {Config} from '.';
import {getTags} from './getTags';
import {getNextTag} from './getNextTag';
import {runUserReleaseScripts} from './runUserReleaseScripts';
import {runUserPreleaseScripts} from './runUserPrereleaseScripts';
import {publishGithubRelease} from './publishGithubRelease';
import {isValidTag} from './semver';

export async function autorel(args: Config): Promise<string|undefined> {

    if (args.useVersion && /^v(.+)$/.test(args.useVersion)) throw new Error('useVersion should not start with a "v".');
    if (args.useVersion && !isValidTag(args.useVersion)) throw new Error('useVersion must be a valid SemVer version');

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

    const nextTag = getNextTag({
        releaseType,
        highestTag,
        highestStableTag,
        highestChannelTag,
        useVersion: args.useVersion,
        prereleaseChannel,
    });
    const changelog = generateChangelog(parsedCommits, commitTypeMap, args.breakingChangeTitle);

    logger.info(`The next version is: ${bold(nextTag)}`);
    logger.debug(`The changelog is:\n${changelog}`);

    if (args.dryRun) return;

    runUserPreleaseScripts(args);
    git.createAndPushTag(nextTag);

    // publish to GitHub
    if (!args.skipRelease) {

        publishGithubRelease(nextTag, changelog);

    }

    // publish to npm
    if (args.publish) {

        updatePackageJsonVersion(nextTag);
        npm.publishPackage(prereleaseChannel);

    }

    // set env variables
    process.env.NEXT_VERSION = nextTag.replace('v', '');
    process.env.NEXT_TAG = nextTag;

    runUserReleaseScripts(args);

    return nextTag.replace('v', '');

}
