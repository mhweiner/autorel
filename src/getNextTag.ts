import * as semver from './semver';
import {ReleaseType} from './semver';

export function getNextTag({
    highestTag,
    highestStableTag,
    highestChannelTag,
    useVersion,
    prereleaseChannel,
    releaseType,
}: {
    highestTag: string|undefined
    highestStableTag: string|undefined
    highestChannelTag: string|undefined
    useVersion: string|undefined
    prereleaseChannel: string|undefined
    releaseType: ReleaseType
}): string {

    return useVersion
        ? `v${useVersion}`
        : semver.toTag(semver.incrVer({
            latestVer: semver.fromTag(highestTag || 'v0.0.0') as semver.SemVer,
            latestStableVer: semver.fromTag(highestStableTag || 'v0.0.0') as semver.SemVer,
            releaseType,
            prereleaseChannel,
            latestChannelVer: highestChannelTag ? semver.fromTag(highestChannelTag) ?? undefined : undefined,
        }));

}
