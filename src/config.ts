import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import {ValidationError, predicates as p, toResult} from '@aeroview-io/rtype';
import output from './lib/output';
import {Args} from '.';
import {defaultConfig} from './defaults';

const validateConfig = p.object({
    dryRun: p.optional(p.boolean()),
    run: p.optional(p.string()),
    runScript: p.optional(p.string()),
    prereleaseChannel: p.optional(p.string()),
    tag: p.optional(p.string()),
    noRelease: p.optional(p.boolean()),
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
function readAutorelYaml(filePath = '.autorel.yaml'): Args | {} {

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

    return parsedData as Args;

}

export function getConfig(): Args {

    const localConfig = readAutorelYaml();

    return {
        ...defaultConfig,
        ...localConfig,
    };

}

