import {$} from './sh';

export function publishPackage(channel?: string): void {

    $`npm publish --tag ${channel || 'latest'}`;

}
