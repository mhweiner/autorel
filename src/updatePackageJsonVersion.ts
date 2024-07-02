import output from './lib/output';
import {writeFileSync} from 'fs';
import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
    name: string
    version: string
    [key: string]: any
}

function readPackageJson(): PackageJson {

    const packageJsonPath = path.resolve(process.cwd(), 'package.json');

    try {

        const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');

        return JSON.parse(packageJsonData);

    } catch (error) {

        output.error('Unable to read or parse package.json');
        throw error;

    }

}

/**
 * Bump the version of the package.json file
 */
export function updatePackageJsonVersion(newVersion: string): void {

    const packageJson = readPackageJson();

    writeFileSync('./package.json', JSON.stringify({
        ...packageJson,
        version: newVersion.replace(/^v/, ''),
    }, null, 2));

    output.log('Successfully updated package.json locally');

}
