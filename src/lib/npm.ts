import {$} from './bash';

export function publishPackage(channel?: string): void {

    $`npm publish --tag ${channel || 'latest'}`;

}
