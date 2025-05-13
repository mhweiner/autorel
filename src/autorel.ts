/* eslint-disable max-lines-per-function */
import * as convCom from './conventionalcommits';
import * as git from './services/git';
import * as npm from './services/npm';
import {generateChangelog} from './changelog';
import * as github from './services/github';
import logger from './lib/logger';
import {updatePackageJsonVersion} from './updatePackageJsonVersion';
import {bold, gray, greenBright, redBright, strikethrough, yellowBright} from 'colorette';
import {getPrereleaseChannel} from './getPrereleaseChannel';
import {Config} from '.';
import {getTags} from './getTags';
import {validateUseVersion} from './validateUseVersion';
import {getNextTag} from './getNextTag';
import {runUserReleaseScripts} from './runUserReleaseScripts';
import {runUserPreleaseScripts} from './runUserPrereleaseScripts';

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

    }

    validateUseVersion(args.useVersion, releaseType);

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

    const {owner, repository} = git.getRepo();

    // publish to GitHub
    if (!args.skipRelease) {

        github.createRelease({
            token: process.env.GITHUB_TOKEN!,
            owner,
            repository,
            tag: nextTag,
            name: nextTag,
            body: changelog,
        });

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
