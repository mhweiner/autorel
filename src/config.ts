import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import {ValidationError, predicates as p, toResult} from '@aeroview-io/rtype';
import output from './lib/output';
import {Config} from '.';
import {defaultConfig} from './defaults';

const validateConfig = p.object({
    dryRun: p.optional(p.boolean()),
    run: p.optional(p.string()),
    runScript: p.optional(p.string()),
    prereleaseChannel: p.optional(p.string()),
    useVersion: p.optional(p.string()),
    skipRelease: p.optional(p.boolean()),
    publish: p.optional(p.boolean()),
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

    } else {

        output.log('Using .autorel.yaml configuration');

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

export function getConfig(overrides?: Partial<Config>): Config {

    const yamlConfig = readAutorelYaml();

    output.debug(`Yaml: ${JSON.stringify(yamlConfig, null, 2)}`);

    return {
        ...defaultConfig,
        ...yamlConfig,
        ...overrides,
    };

}

