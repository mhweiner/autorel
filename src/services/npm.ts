import {$} from './sh';

/**
 * Publishes the current package with an optional dist-tag.
 */
export function publishPackage(channel?: string): void {

    $`npm publish --tag ${channel ?? 'latest'} --loglevel warn`;

}

/**
 * Unpublishes a specific package version (e.g., "my-lib@1.2.3").
 */
export function unpublishPackage(packageName: string, version: string): void {

    $`npm unpublish ${packageName}@${version} --loglevel warn`;

}
