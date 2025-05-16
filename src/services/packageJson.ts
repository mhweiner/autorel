import logger from './logger';
import {writeFileSync} from 'fs';
import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
    name: string
    version: string
    [key: string]: any
}

export function read(): PackageJson {

    const packageJsonPath = path.resolve(process.cwd(), 'package.json');

    try {

        const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');

        return JSON.parse(packageJsonData) as PackageJson;

    } catch (error) {

        logger.error('Unable to read or parse package.json');
        throw error;

    }

}

/**
 * Bump the version of the package.json file
 */
export function setVersion(newVersion: string): void {

    const packageJson = read();

    writeFileSync('./package.json', JSON.stringify({
        ...packageJson,
        version: newVersion.replace(/^v/, ''),
    }, null, 2));

}
