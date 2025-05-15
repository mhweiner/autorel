import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import {predicates as p, toResult} from 'typura';
import output from './services/logger';
import {Config} from '.';
import {defaultConfig} from './defaults';

const useVersionRegex = /^v?(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<channel>[0-9a-zA-Z-]+)(?:\.(?<build>[0-9a-zA-Z-]+))?)?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const releaseType = p.union([
    p.literal('major' as const),
    p.literal('minor' as const),
    p.literal('patch' as const),
    p.literal('none' as const),
], 'must be one of: major, minor, patch, or none');
export const commitType = p.object({
    type: p.string(),
    title: p.string(),
    release: releaseType,
});

export const validateConfig = p.object({
    dryRun: p.optional(p.boolean()),
    run: p.optional(p.string()),
    preRun: p.optional(p.string()),
    runScript: p.optional(p.string()),
    prereleaseChannel: p.optional(p.union([
        p.string(),
        p.literal(null),
        p.literal(false),
    ], 'must be a string, null, or false')),
    useVersion: p.optional(p.regex(useVersionRegex, 'Invalid version format. Should be x.y.z or x.y.z-channel.build')),
    skipRelease: p.optional(p.boolean()),
    publish: p.optional(p.boolean()),
    breakingChangeTitle: p.optional(p.string()),
    commitTypes: p.array(commitType),
    branches: p.array(p.object({
        name: p.string(),
        prereleaseChannel: p.optional(p.string()),
    })),
    githubToken: p.optional(p.string()),
});

/**
 * Reads and parses a local .autorel.yaml file.
 * @param filePath The path to the .autorel.yaml file.
 * @returns The parsed JSON object from the YAML file.
 */
function readAutorelYaml(filePath = '.autorel.yaml'): any {

    const absolutePath = path.resolve(filePath);

    // Check if the file exists
    if (!fs.existsSync(absolutePath)) {

        output.info('.autorel.yaml not found, using default configuration');
        return {};

    } else {

        output.info('Using .autorel.yaml configuration');

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

    return parsedData;

}

export function getConfig(overrides?: Partial<Config>): any {

    const yamlConfig = readAutorelYaml();
    const mergedConfig = {
        ...defaultConfig,
        ...yamlConfig,
        ...overrides ?? {},
    };

    output.debug('---\nConfig:');
    output.debug(`Default: ${JSON.stringify(defaultConfig, null, 2)}`);
    output.debug(`Yaml: ${JSON.stringify(yamlConfig, null, 2)}`);
    output.debug(`Overrides: ${JSON.stringify(overrides, null, 2)}`);
    output.debug('---');

    return mergedConfig;

}

