/* eslint-disable max-lines-per-function */
import * as semver from './semver';
import * as convCom from './conventionalcommits';
import * as git from './lib/git';
import * as npm from './lib/npm';
import * as color from './lib/colors';
import {generateChangelog} from './changelog';
import * as github from './services/github';
import output from './lib/output';
import {updatePackageJsonVersion} from './updatePackageJsonVersion';
import {bash} from './lib/sh';

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

export function getPrereleaseChannel(config: Config): string|undefined {

    if (config.prereleaseChannel) return config.prereleaseChannel;

    const branch = git.getCurrentBranch();

    if (!branch) throw new Error('Could not get the current branch.');

    if (!config.branches || !config.branches.length) throw new Error('Branches are not defined in the configuration.');

    const matchingBranch = config.branches.find((b) => b.name === branch);

    if (!matchingBranch) return undefined;

    return matchingBranch.prereleaseChannel || undefined;

}

export async function autorel(args: Config): Promise<string|undefined> {

    const prereleaseChannel = getPrereleaseChannel(args);

    if (args.dryRun) {

        output.warn('Running in dry-run mode. No changes will be made.');

    }

    if (prereleaseChannel && !args.useVersion) {

        output.log(`Using prerelease channel: ${color.bold(prereleaseChannel)}`);

    }

    const commitTypeMap = new Map(args.commitTypes.map((type) => [type.type, type]));

    // fetch latest tags
    git.gitFetchTags();

    const lastTag = git.getLastTag();
    const lastProdTag = git.getLastProdTag();

    output.log(`The last tag is: ${lastTag ? color.bold(lastTag) : color.grey('none')}`);
    output.log(`The last production tag is: ${lastProdTag ? color.bold(lastProdTag) : color.grey('none')}`);

    const commits = git.getCommitsSinceLastTag(lastTag);

    output.log(`Found ${color.bold(commits.length.toString())} commit(s) ${lastTag ? `since ${lastTag}` : 'in the repository'}.`);

    const parsedCommits = commits.map((commit) => convCom.parseConventionalCommit(commit.message, commit.hash))
        .filter((commit) => !!commit) as convCom.ConventionalCommit[];
    const releaseType = convCom.determineReleaseType(parsedCommits, commitTypeMap);
    const releaseTypeStr = (releaseType === 'none' && color.grey('none'))
            || (releaseType === 'major' && color.red('major'))
            || (releaseType === 'minor' && color.yellow('minor'))
            || (releaseType === 'patch' && color.green('patch'));

    output.log(`The release type is: ${releaseTypeStr}`);

    if (releaseType === 'none' && !args.useVersion) {

        output.log('No release is needed. Have a nice day (^_^)/');

        return;

    }

    let nextTagCalculated = '';

    if (args.useVersion) {

        if (/^v(.+)$/.test(args.useVersion)) throw new Error('useVersion should not start with a "v".');
        if (!semver.isValidVersion(args.useVersion)) throw new Error('useVersion must be a valid SemVer version');

        if (releaseType === 'none') {

            output.warn(`We didn't find any commmits that would create a release, but you have set 'useVersion', which will force a release as: ${color.bold(args.useVersion)}.`);

        } else {

            output.warn(`The next version was set by useVersion to be: ${color.bold(args.useVersion)}.`);

        }

    } else {

        nextTagCalculated = semver.incrementVersion(
            lastProdTag || 'v0.0.1',
            lastTag || 'v0.0.1',
            releaseType,
            prereleaseChannel,
        );

        output.log(`The next version is: ${color.bold(nextTagCalculated)}`);

    }

    const nextTag = args.useVersion ? `v${args.useVersion}` : nextTagCalculated;
    const changelog = generateChangelog(parsedCommits, commitTypeMap, args.breakingChangeTitle);

    output.debug(`The changelog is:\n${changelog}`);

    if (args.dryRun) return;

    if (args.preRun) {

        output.log('Running pre-release bash script:');
        output.log('----------------------------');
        output.log(args.preRun);
        output.log('----------------------------');
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

        output.log('Running post-release bash script/command:');
        output.log('----------------------------');
        output.log(args.run);
        output.log('----------------------------');
        bash(args.run);

    } else if (args.runScript) {

        // TODO: delete this block in the next major version

        output.warn('----------------------------');
        output.warn('🚨 The "runScript" option is deprecated. Please use "run" instead. 🚨');
        output.warn('🚨 The "runScript" option will be removed in the next major version. 🚨');
        output.warn('----------------------------');

        output.log('Running post-release bash script:');
        output.log('');
        output.log('----------------------------');
        output.log(args.runScript);
        output.log('----------------------------');
        output.log('');
        bash(args.runScript);

    }

    return nextTag.replace('v', '');

}

