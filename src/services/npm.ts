import {$} from './sh';

/**
 * Checks if a specific package version exists in the npm registry.
 *
 * Returns:
 * - `true` if the version exists
 * - `false` if the version does not exist (404)
 * - `false` if there's a network/registry error (treated as "doesn't exist" to allow publish attempt)
 *
 * Note: Network errors are treated as "doesn't exist" because npm publish will
 * handle the actual error if the version truly exists, and network issues during
 * publish are handled separately.
 */
export function versionExists(packageName: string, version: string): boolean {

    try {

        // Use simpler command - just check if the package@version exists
        // This returns the package.json if it exists, or errors with 404 if not
        $`npm view ${packageName}@${version} --loglevel silent`;
        return true;

    } catch {

        // Version doesn't exist (404) or network/registry error occurred
        // Return false to allow publish attempt - npm publish will handle
        // the actual error appropriately if the version truly exists
        return false;

    }

}

/**
 * Publishes the current package with an optional dist-tag.
 */
export function publishPackage(channel?: string): void {

    $`npm publish --tag ${channel ?? 'latest'} --loglevel warn`;

}

/**
 * Unpublishes a specific package version (e.g., "my-lib@1.2.3").
 *
 * This may fail if:
 * - npm registry no longer allows unpublishing (policy restrictions)
 * - The package version has already been unpublished
 * - Network or authentication errors occur
 *
 * Returns `true` if successful, `false` if it failed.
 */
export function unpublishPackage(packageName: string, version: string): boolean {

    try {

        $`npm unpublish ${packageName}@${version} --loglevel warn`;
        return true;

    } catch {

        return false;

    }

}
