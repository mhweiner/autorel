import {bold} from 'colorette';
import logger from './lib/logger';
import {isValidTag, ReleaseType} from './semver';

export function validateUseVersion(
    useVersion: string|undefined,
    releaseType: ReleaseType,
): void {

    if (!useVersion) return;

    if (/^v(.+)$/.test(useVersion)) throw new Error('useVersion should not start with a "v".');
    if (!isValidTag(useVersion)) throw new Error('useVersion must be a valid SemVer version');

    if (releaseType === 'none') {

        logger.warn(`We didn't find any commmits that would create a release, but you have set 'useVersion', which will force a release as: ${bold(useVersion)}.`);

    } else {

        logger.warn(`The next version was explicitly set by useVersion to be: ${bold(useVersion)}.`);

    }

}
