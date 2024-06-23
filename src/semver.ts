/* eslint-disable max-lines-per-function */
type Semver = {
    major: number
    minor: number
    patch: number
    channel?: string
    build?: number
};

export function toTag(version: Semver): string {

    let versionString = `${version.major}.${version.minor}.${version.patch}`;

    if (version.channel) {

        versionString += `-${version.channel}`;

        if (version.build) {

            versionString += `.${version.build}`;

        }

    }

    return `v${versionString}`;

}

export function fromTag(tag: string): Semver | null {

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

export function incrementVersion(
    lastProductionTag: string,
    lastTag: string,
    releaseType: 'major' | 'minor' | 'patch' | 'none',
    prereleaseChannel?: string
): string {

    const lastVersion = fromTag(lastTag);

    if (!lastVersion) throw new Error('lastTag is not a valid semver tag.');

    const {major, minor, patch, channel, build} = lastVersion;
    const lastProductionVersion = fromTag(lastProductionTag);

    if (!lastProductionVersion) throw new Error('lastProductionTag is not a valid semver tag.');

    const {major: prodMajor, minor: prodMinor, patch: prodPatch} = lastProductionVersion;

    // some sanity checks
    if (major < prodMajor) throw new Error('The current version must be greater than or equal to the last production version following SemVer rules.');
    if (major === prodMajor && minor < prodMinor) throw new Error('The current version must be greater than or equal to the last production version following SemVer rules.');
    if (major === prodMajor && minor === prodMinor && patch < prodPatch) throw new Error('The current version must be greater than or equal to the last production version following SemVer rules.');
    if (!!channel && major === prodMajor && minor === prodMinor && patch === prodPatch) throw new Error('The current version must be greater than or equal to the last production version following SemVer rules.');

    if (!channel && !prereleaseChannel) {

        // prod to prod
        // ex: v1.0.1 -> v1.0.2

        switch (releaseType) {

            case 'major':

                // ex: v1.0.1 -> v2.0.0
                return toTag({major: major + 1, minor: 0, patch: 0});

            case 'minor':

                // ex: v1.0.1 -> v1.1.0
                return toTag({major, minor: minor + 1, patch: 0});

            case 'patch':

                // ex: v1.0.1 -> v1.0.2
                return toTag({major, minor, patch: patch + 1});

            default:

                // no changes on a prod release means we return the same version
                return toTag(lastVersion);

        }

    } else if (!channel && !!prereleaseChannel) {

        // prod to prerelease
        // ex: v1.0.1 -> v1.0.2-alpha.1

        switch (releaseType) {

            case 'major':

                // ex: v1.0.1 -> v2.0.0-alpha.1
                return toTag({major: major + 1, minor: 0, patch: 0, channel: prereleaseChannel, build: 1});

            case 'minor':

                // ex: v1.0.1 -> v1.1.0-alpha.1
                return toTag({major, minor: minor + 1, patch: 0, channel: prereleaseChannel, build: 1});

            case 'patch':

                // ex: v1.0.1 -> v1.0.2-alpha.1
                return toTag({major, minor, patch: patch + 1, channel: prereleaseChannel, build: 1});

            default:

                // no changes on a prod release means we return the same version
                return toTag(lastVersion);

        }

    } else if (!!channel && !!prereleaseChannel) {

        // prerelease to prerelease
        // ex: v1.0.1-alpha.1 -> v1.1.0-alpha.1

        if (channel === prereleaseChannel) {

            // same channel
            // ex: v1.0.1-alpha.1 -> v1.0.1-alpha.2

            if (releaseType === 'none') return lastTag; // no changes

            // increment the last production version
            const nextVersionNaked = incrByType(lastProductionVersion, releaseType);

            // if the version is the same, increment the build number
            const lastVersionNaked = {major, minor, patch};

            if (toTag(nextVersionNaked) === toTag(lastVersionNaked)) {

                // increment build number
                return toTag({
                    ...lastVersionNaked,
                    channel,
                    build: build ? build + 1 : 1,
                });

            } else {

                // different version
                return toTag({...nextVersionNaked, channel, build: 1});

            }

        } else {

            // different channel
            // ex: v1.0.1-alpha.1 -> v1.0.1-beta.1

            if (releaseType === 'none') {

                // no changes but the channel is different
                // ex: v1.0.1-alpha.1 -> v1.0.1-beta.1
                return toTag({...lastVersion, channel: prereleaseChannel, build: 1});

            }

            return toTag(incrByType({
                ...lastProductionVersion,
                channel: prereleaseChannel,
                build: 1,
            }, releaseType));

        }

    } else {

        // prerelease to prod
        // ex: v1.0.1-alpha.1 -> v1.0.1
        return toTag({
            major,
            minor,
            patch,
        });

    }

}

function incrByType(version: Semver, type: 'major' | 'minor' | 'patch'): Semver {

    switch (type) {

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

function incrPatch(version: Semver): Semver {

    return {
        ...version,
        major: version.major,
        minor: version.minor,
        patch: version.patch + 1,
        ...(version.build ? {build: 1} : {}),
    };

}

function incrMinor(version: Semver): Semver {

    return {
        ...version,
        major: version.major,
        minor: version.minor + 1,
        patch: 0,
        ...(version.build ? {build: 1} : {}),
    };

}

function incrMajor(version: Semver): Semver {

    return {
        ...version,
        major: version.major + 1,
        minor: 0,
        patch: 0,
        ...(version.build ? {build: 1} : {}),
    };

}
