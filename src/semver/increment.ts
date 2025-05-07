import {compareVersions, latestVersion} from './compare';
import {isVerPrerelease, rootVersion} from './parse';
import {ReleaseType, SemVer} from './types';
import {errors} from './errors';

export function incrByType(version: SemVer, releaseType: ReleaseType): SemVer {

    switch (releaseType) {

        case 'major':

            return incrMajor(version);

        case 'minor':

            return incrMinor(version);

        case 'patch':

            return incrPatch(version);

        default:
            return version;

    }

}

export function incrPatch(version: SemVer): SemVer {

    return {
        ...version,
        major: version.major,
        minor: version.minor,
        patch: version.patch + 1,
        ...(version.build ? {build: 1} : {}),
    };

}

export function incrMinor(version: SemVer): SemVer {

    return {
        ...version,
        major: version.major,
        minor: version.minor + 1,
        patch: 0,
        ...(version.build ? {build: 1} : {}),
    };

}

export function incrMajor(version: SemVer): SemVer {

    return {
        ...version,
        major: version.major + 1,
        minor: 0,
        patch: 0,
        ...(version.build ? {build: 1} : {}),
    };

}

/**
 * Increments the version based on the release type. The next version must
 * be greater than the latest version except for the following case:
 * 2. The latest version is a prerelease of a different channel. Even in this case,
 *   the next version must be greater than the last stable/production version.
 *
 * Parameters:
 * - `latestVer` is typically the current version of the package and the same as
 *   `latestStableVer` if the last release was a stable/production release.
 * - `latestStableVer` is the last stable/production release.
 * - `releaseType` is the type of release to make.
 * - `prereleaseChannel` is the name of the prerelease channel, if it's a prerelease.
 * - `latestChannelVer` is the last version of the package on the same channel.
 */
// eslint-disable-next-line max-lines-per-function
export function incrVer(input: {
    latestVer: SemVer
    latestStableVer: SemVer
    latestChannelVer?: SemVer
    releaseType: ReleaseType
    prereleaseChannel?: string
}): SemVer {

    const {latestStableVer, latestVer, releaseType, prereleaseChannel, latestChannelVer} = input;

    // Validate the input
    if (releaseType === 'none') throw new Error(errors.noReleaseErr);
    if (compareVersions(latestVer, latestStableVer) < 0) throw new Error(errors.outOfOrderErr);
    if (isVerPrerelease(latestStableVer)) throw new Error(errors.stableVerNotValid);
    if (prereleaseChannel && latestChannelVer && compareVersions(latestChannelVer, latestVer) > 0)
        throw new Error(errors.lastChannelVerTooLarge);
    if (prereleaseChannel && latestChannelVer && prereleaseChannel !== latestChannelVer.channel)
        throw new Error(errors.lastChannelVerNotSameChannel);

    const isPrerelease = !!prereleaseChannel;
    const nextRootVer = latestVersion(incrByType(latestStableVer, releaseType), rootVersion(latestVer));

    if (isPrerelease) {

        const nextVer = {
            ...nextRootVer,
            channel: prereleaseChannel,
            build: 1,
        };

        // If no previous version exists on this channel, start a new prerelease with build 1.
        // If the proposed next version is greater than the latest on this channel,
        // return the next version (with build=1).
        // Otherwise, continue the current prerelease by incrementing the build number.
        if (!latestChannelVer || compareVersions(nextVer, latestChannelVer) > 0) {

            return nextVer;

        } else {

            // Otherwise, increment the build number of the last channel version
            return {
                ...latestChannelVer,
                build: (latestChannelVer.build ?? 0) + 1,
            };

        }

    } else {

        return nextRootVer;

    }

}
