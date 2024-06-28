import {$} from './bash';

export function publishPackage(npmToken: string, channel?: string): void {

    $`echo "//registry.npmjs.org/:_authToken=${npmToken}" > ~/.npmrc`;

    const cat = $`cat ~/.npmrc`;

    console.log(cat);

    $`npm publish --tag ${channel || 'latest'}`;

}
