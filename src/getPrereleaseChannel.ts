import {Config} from '.';
import * as git from './services/git';

/**
 * Determines the prerelease channel to use for the current release.
 *
 * It follows this order of precedence:
 * 1. Use `config.prereleaseChannel` if explicitly defined.
 * 2. Otherwise, detect the current git branch and look for a matching entry
 *    in `config.branches` to infer the prerelease channel.
 *
 * Returns:
 * - A string representing the prerelease channel (e.g. "alpha", "beta"), or
 * - `undefined` if no channel is configured or matched.
 *
 * Throws:
 * - If the current branch cannot be determined.
 * - If `config.branches` is undefined or empty.
 */
export function getPrereleaseChannel(config: Config): string|undefined {

    if (config.prereleaseChannel) return config.prereleaseChannel;

    const branch = git.getCurrentBranch();

    if (!branch) throw new Error('Could not get the current branch. Please make sure you are in a git repository.');
    if (!config.branches.length) throw new Error('Branches are not defined in the configuration. See https://github.com/mhweiner/autorel?tab=readme-ov-file#configuration');

    const matchingBranch = config.branches.find((b) => b.name === branch);

    if (!matchingBranch) return undefined;

    return matchingBranch.prereleaseChannel ?? undefined;

}
