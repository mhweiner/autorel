import {highestVersion} from './compare';
import {SemVer} from './types';
import {predicates as p, toResult} from 'typura';

const isValidSemVer = p.object({
    major: p.number(),
    minor: p.number(),
    patch: p.number(),
    channel: p.optional(p.string()),
    build: p.optional(p.number()),
});

export function toTag(version: SemVer): string {

    const [validationErr] = toResult(() => isValidSemVer(version));

    if (validationErr) {

        throw new Error('Invalid SemVer object', {cause: validationErr});

    }

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

    return normalizeVer({
        major: parseInt(major, 10), // radix is necessary to avoid octal literals
        minor: parseInt(minor, 10),
        patch: parseInt(patch, 10),
        ...(channel ? {channel} : {}),
        ...(build ? {build: parseInt(build, 10)} : {}),
    });

}

/**
 * Checks if a version string is a valid SemVer tag by attempting to parse it.
 */
export function isValidTag(ver: string): boolean {

    return !!fromTag(ver);

}

export function isValidVersion(version: SemVer): boolean {

    const [err, tag] = toResult(() => toTag(version));

    if (err) return false;

    return !!fromTag(tag);

}

export function isVerPrerelease(version: SemVer): boolean {

    return !!version.channel;

}

/**
 * Normalizes a SemVer object by ensuring that the channel and build properties are set.
 */
export function normalizeVer(version: SemVer): SemVer {

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
 * Returns the root version of a SemVer object (ie, without the channel and build).
 * Examples:
 * - 1.0.0-alpha.1 => 1.0.0
 * - 1.0.0 => 1.0.0
 */
export function rootVersion(version: SemVer): SemVer {

    return {
        major: version.major,
        minor: version.minor,
        patch: version.patch,
    };

}

/**
 * Takes a list of tags and returns the latest version.
 */
export function getLatestVerFromTags(tags: string[]): SemVer | null {

    const versions = tags.map(fromTag).filter((v): v is SemVer => !!v);

    if (versions.length === 0) return null;

    return versions.reduce(highestVersion);

}

