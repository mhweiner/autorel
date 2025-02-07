/* eslint-disable max-lines-per-function */
export type SemVer = {
    major: number
    minor: number
    patch: number
    channel?: string
    build?: number
};
export type ReleaseType = 'major' | 'minor' | 'patch' | 'none';

export function toTag(version: SemVer): string {

    let versionString = `${version.major}.${version.minor}.${version.patch}`;

    if (version.channel) {

        versionString += `-${version.channel}`;

        if (version.build) {

            versionString += `.${version.build}`;

        }

    }

    return `v${versionString}`;

}

export function fromTag(tag: string): SemVer | null {

    const semverRegex = /^v(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<channel>[0-9a-zA-Z-]+)(?:\.(?<build>[0-9a-zA-Z-]+))?)?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    const match = tag.match(semverRegex);

    if (!match || !match.groups) {

        return null;

    }

    const {major, minor, patch, channel, build} = match.groups;

    return {
        major: parseInt(major, 10), // radix is necessary to avoid octal literals
        minor: parseInt(minor, 10),
        patch: parseInt(patch, 10),
        ...(channel ? {channel} : {}),
        ...(build ? {build: parseInt(build, 10)} : {}),
    };

}

export function isVerPrerelease(version: SemVer): boolean {

    return !!version.channel;

}

export function normalize(version: SemVer): SemVer {

    return {
        major: version.major,
        minor: version.minor,
        patch: version.patch,
        ...(version.channel ? {
            channel: version.channel,
            build: version.build || 1,
        } : {}),
    };

}

/**
 * Compares two versions and returns:
 * - 1 if version1 is greater than version2
 * - -1 if version1 is less than version2
 * - 0 if they are equal
 */
export function compareVersions(version1: SemVer, version2: SemVer): number {

    const version1n = normalize(version1);
    const version2n = normalize(version2);

    if (version1n.major > version2n.major) return 1;
    if (version1n.major < version2n.major) return -1;

    if (version1n.minor > version2n.minor) return 1;
    if (version1n.minor < version2n.minor) return -1;

    if (version1n.patch > version2n.patch) return 1;
    if (version1n.patch < version2n.patch) return -1;

    if (!version1n.channel && !!version2n.channel) return 1;
    if (!!version1n.channel && !version2n.channel) return -1;

    if (!version1n.build && !!version2n.build) return 1;
    if (!!version1n.build && !version2n.build) return -1;

    // compare channel
    if (version1n.channel && version2n.channel) {

        if (version1n.channel > version2n.channel) return 1;
        if (version1n.channel < version2n.channel) return -1;

        // compare build
        if (version1n.build && version2n.build) {

            if (version1n.build > version2n.build) return 1;
            if (version1n.build < version2n.build) return -1;

        }

    }

    return 0;

}

export function rootVersion(version: SemVer): SemVer {

    return {
        major: version.major,
        minor: version.minor,
        patch: version.patch,
    };

}

export function highestVersion(version1: SemVer, version2: SemVer): SemVer {

    const comparison = compareVersions(version1, version2);

    return normalize(comparison > 0 ? version1 : version2);

}

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

export function isValidTag(ver: string): boolean {

    return !!fromTag(ver);

}

export function isValidVersion(version: SemVer): boolean {

    return !!fromTag(toTag(version));

}

export const outOfOrderErr = 'The current/highest version cannot be less than the last stable/production version (following SemVer).'
        + '\n\nTo fix this, we recommend using the --use-version flag to specify the version you want to use.';
export const stableVerNotValid = 'The stable version cannot be a prerelease.';
export const lastChannelVerNotSameChannel = 'The last channel version must be a prerelease of the same channel.';
export const lastChannelVerTooLarge = 'The last channel version cannot be greater than the highest version.';

/**
 * Increments the version based on the release type. The next version must
 * be greater than the highest/current version except for the following cases:
 * 1. The release type is 'none'.
 * 2. The highest version is a prerelease of a different channel. Even in this case,
 *   the next version must be greater than the last stable/production version.
 *
 * Parameters:
 * - `highestVer` is typically the current version of the package and the
 *   same as `lastStableVer` if the last release was a stable/production release.
 * - `lastStableVer` is the last stable/production release.
 * - `releaseType` is the type of release to make.
 * - `prereleaseChannel` is the name of the prerelease channel, if it's a prerelease.
 * - `lastChannelVer` is the last version of the package on the same channel.
 */
export function incrVer(input: {
    highestVer: SemVer
    lastStableVer: SemVer
    releaseType: ReleaseType
    prereleaseChannel?: string
    lastChannelVer?: SemVer
}): SemVer {

    const {lastStableVer, highestVer, releaseType, prereleaseChannel, lastChannelVer} = input;

    if (releaseType === 'none') return highestVer;
    if (compareVersions(highestVer, lastStableVer) < 0) throw new Error(outOfOrderErr);
    if (isVerPrerelease(lastStableVer)) throw new Error(stableVerNotValid);
    if (prereleaseChannel && lastChannelVer && compareVersions(lastChannelVer, highestVer) > 0)
        throw new Error(lastChannelVerTooLarge);
    if (prereleaseChannel && lastChannelVer && prereleaseChannel !== lastChannelVer.channel)
        throw new Error(lastChannelVerNotSameChannel);

    const isPrerelease = !!prereleaseChannel;
    const nextRootVer = highestVersion(incrByType(lastStableVer, releaseType), rootVersion(highestVer));

    if (isPrerelease) {

        const nextVer = {
            ...nextRootVer,
            channel: prereleaseChannel,
            build: 1,
        };

        if (!lastChannelVer || compareVersions(nextVer, lastChannelVer) > 0) {

            return nextVer;

        } else {

            return {
                ...lastChannelVer,
                build: (lastChannelVer.build || 0) + 1,
            };

        }

    } else {

        return nextRootVer;

    }

}
