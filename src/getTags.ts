/* eslint-disable max-lines-per-function */
import * as git from './services/git';
import * as semver from './semver';

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

    return {
        highestTag,
        highestStableTag,
        highestChannelTag,
        tagFromWhichToFindCommits,
    };

}
