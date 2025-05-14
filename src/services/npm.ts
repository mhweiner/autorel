import {$} from './sh';

/**
 * Publishes the current package with an optional dist-tag.
 */
export function publishPackage(channel?: string): void {

    $`npm publish --tag ${channel ?? 'latest'}`;

}

/**
 * Unpublishes a specific package version (e.g., "my-lib@1.2.3").
 */
export async function unpublishPackage(packageAndVersion: string): Promise<void> {

    $`npm unpublish ${packageAndVersion}`;

}
