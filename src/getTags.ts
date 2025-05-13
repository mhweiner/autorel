import * as git from './services/git';
import * as semver from './semver';
import logger from './lib/logger';
import {bold, gray} from 'colorette';

export function getTags(prereleaseChannel?: string): {
    highestTag: string|undefined
    highestStableTag: string|undefined
    highestChannelTag: string|undefined
    tagFromWhichToFindCommits: string|undefined
} {

    const recentTags = git.getRecentTags();
    const highestTag = semver.highestTag(recentTags);
    const highestStableTag = semver.highestStableTag(recentTags);
    const highestChannelTag = prereleaseChannel
        ? semver.highestChannelTag(recentTags, prereleaseChannel)
        : undefined;

    // Determine the starting Git tag to compare against when generating
    // release notes or changelogs (i.e. the point “since” which to find commits).
    // If a pre-release channel is specified, and that channel has a tag, and
    // it is higher than the stable tag, use that tag. Otherwise, use the stable tag.
    const tagFromWhichToFindCommits = highestChannelTag
        ? semver.highestTag([highestChannelTag, highestStableTag ?? 'v0.0.0'])
        : highestStableTag;

    !!highestChannelTag && logger.info(`The last pre-release channel version (${prereleaseChannel}) is: ${bold(highestChannelTag)}`);
    logger.info(`The last stable/production version is: ${highestStableTag ? bold(highestStableTag) : gray('none')}`);
    logger.info(`The current/highest version is: ${highestTag ? bold(highestTag) : gray('none')}`);
    logger.info(`Fetching commits since ${tagFromWhichToFindCommits ?? 'the beginning of the repository'}...`);

    return {
        highestTag,
        highestStableTag,
        highestChannelTag,
        tagFromWhichToFindCommits,
    };

}
