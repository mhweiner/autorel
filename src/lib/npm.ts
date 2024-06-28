import {$} from './bash';

export function publishPackage(npmToken: string, channel?: string): void {

    $`npm publish --tag ${channel || 'latest'}`;

}
