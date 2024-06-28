import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import {ValidationError, predicates as p, toResult} from '@aeroview-io/rtype';
import output from './lib/output';

export type CommitType = {
    type: string
    title: string
    release: 'minor' | 'patch' | 'none'
};
export type ReleaseBranch = {
    name: string
    prereleaseChannel?: string
};
export type Config = {
    breakingChangeTitle: string
    commitTypes: CommitType[]
    branches: ReleaseBranch[]
};

export const defaultConfig: Config = {
    breakingChangeTitle: '🚨 Breaking Changes 🚨',
    commitTypes: [
        {type: 'feat', title: '✨ Features', release: 'minor'},
        {type: 'fix', title: '🐛 Bug Fixes', release: 'patch'},
        {type: 'perf', title: '⚡ Performance Improvements', release: 'patch'},
        {type: 'revert', title: '⏪ Reverts', release: 'patch'},
        {type: 'docs', title: '📚 Documentation', release: 'none'},
        {type: 'style', title: '💅 Styles', release: 'none'},
        {type: 'refactor', title: '🛠 Code Refactoring', release: 'none'},
        {type: 'test', title: '🧪 Tests', release: 'none'},
        {type: 'build', title: '🏗 Build System', release: 'none'},
        {type: 'ci', title: '🔧 Continuous Integration', release: 'none'},
    ],
    branches: [
        {name: 'main'},
    ],
};

const validateConfig = p.object({
    breakingChangeTitle: p.optional(p.string()),
    commitTypes: p.optional(p.array(p.object({
        type: p.string(),
        title: p.string(),
        release: p.string(),
    }))),
    branches: p.optional(p.array(p.object({
        name: p.string(),
        prereleaseChannel: p.optional(p.string()),
    }))),
});

/**
 * Reads and parses a local .autorel.yaml file.
 * @param filePath The path to the .autorel.yaml file.
 * @returns The parsed JSON object from the YAML file.
 */
function readAutorelYaml(filePath = '.autorel.yaml'): Config | {} {

    const absolutePath = path.resolve(filePath);

    // Check if the file exists
    if (!fs.existsSync(absolutePath)) {

        output.log('.autorel.yaml not found, using default configuration');
        return {};

    }

    const [readErr, fileContents] = toResult(() => fs.readFileSync(absolutePath, 'utf8'));

    if (readErr) {

        output.error('Error reading .autorel.yaml file:');
        throw readErr;

    }

    const [parseErr, parsedData] = toResult(() => yaml.load(fileContents));

    if (parseErr) {

        output.error('Error parsing .autorel.yaml file:');
        throw parseErr;

    }

    const [validationErr] = toResult(() => validateConfig(parsedData));

    if (validationErr instanceof ValidationError) {

        output.error('Invalid configuration:');
        throw validationErr;

    }

    return parsedData as Config;

}

export function getConfig(): Config {

    const localConfig = readAutorelYaml();

    return {
        ...defaultConfig,
        ...localConfig,
    };

}

