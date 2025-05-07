import {normalizeVer} from './parse';
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

/**
 * Returns the latest version of two SemVer objects.
 */
export function latestVersion(version1: SemVer, version2: SemVer): SemVer {

    const comparison = compareVersions(version1, version2);

    return normalizeVer(comparison > 0 ? version1 : version2);

}
