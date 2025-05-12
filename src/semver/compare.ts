import {normalizeVer, parseTags, VersionWithRaw} from './parse';
import {SemVer} from './types';

/**
 * Compares two versions and returns:
 * - 1 if version1 is greater than version2
 * - -1 if version1 is less than version2
 * - 0 if they are equal
 */
export function compareVersions(version1: SemVer, version2: SemVer): number {

    const version1n = normalizeVer(version1);
    const version2n = normalizeVer(version2);

    if (version1n.major > version2n.major) return 1;
    if (version1n.major < version2n.major) return -1;

    if (version1n.minor > version2n.minor) return 1;
    if (version1n.minor < version2n.minor) return -1;

    if (version1n.patch > version2n.patch) return 1;
    if (version1n.patch < version2n.patch) return -1;

    if (!version1n.channel && !!version2n.channel) return 1;
    if (!!version1n.channel && !version2n.channel) return -1;

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

/**
 * Returns the highest version of two SemVer objects (nomalized).
 */
export function highestVersion(version1: SemVer, version2: SemVer): SemVer {

    const comparison = compareVersions(version1, version2);

    return normalizeVer(comparison > 0 ? version1 : version2);

}

/**
 * Returns the tag with the highest version.
 */
export function highestTag(tags: string[]): string | undefined {

    const parsed = parseTags(tags);

    if (parsed.length === 0) return undefined;

    return highest(parsed).raw;

}

/**
 * Returns the tag with the highest version for a specific channel.
 */
export function highestChannelTag(tags: string[], channel: string): string | undefined {

    const parsed = parseTags(tags)
        .filter((entry) => entry.version.channel === channel);

    if (parsed.length === 0) return undefined;

    return highest(parsed).raw;

}

/**
 * Returns the tag with the highest version that does not have a channel.
 */
export function highestStableTag(tags: string[]): string | undefined {

    const parsed = parseTags(tags)
        .filter((entry) => !entry.version.channel);

    if (parsed.length === 0) return undefined;

    return highest(parsed).raw;

}

/**
 * Returns the raw tag string with the highest version.
 */
export function highest(parsed: VersionWithRaw[]): VersionWithRaw {

    return parsed.reduce((a, b) => compareVersions(a.version, b.version) >= 0 ? a : b);

}
