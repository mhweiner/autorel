const noReleaseErr = 'Release type is set to "none"';
const outOfOrderErr = 'The latest version cannot be less than the last stable/production version (following SemVer).'
        + '\n\nTo fix this, we recommend using the --use-version flag to specify the version you want to use.';
const stableVerNotValid = 'The stable version cannot be a prerelease.';
const lastChannelVerNotSameChannel = 'The last channel version must be a prerelease of the same channel.';
const lastChannelVerTooLarge = 'The latest channel version cannot be greater than the latest version.';

export const errors = {
    noReleaseErr,
    outOfOrderErr,
    stableVerNotValid,
    lastChannelVerNotSameChannel,
    lastChannelVerTooLarge,
};
