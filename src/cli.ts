import {Command} from 'commander';
import {bold, gray, white} from 'colorette';
import {autorel} from '.';
import {getConfig} from './config';
import logger from './services/logger';
import {serializeError} from 'jsout/dist/serializeError';
import {formatSerializedError} from 'jsout/dist/formatters/formatSerializedError';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const packageJson = require('../package.json');
const program = new Command();

console.log('------------------------------');
console.log(`🚀 ${bold(white('AutoRel'))} ${gray(`v${packageJson.version}`)}`);
console.log('------------------------------');

program
    .name('autorel')
    .version(packageJson.version, '-v, --version')
    .description('An example CLI for managing a directory')
    .option('--dry-run', 'Do a dry run (arg: dryRun)')
    .option('--pre-release <value>', 'Pre-release channel. If specified, the release will be marked as a pre-release. Overrides branches configuration. (arg: preRelease)')
    .option('--use-version <value>', 'Specify a version to be used instead of calculating it from commit analysis. Must be a valid SemVer version, with no \'v\'. Overrides --pre-release, commitType, and branches configuration. (arg: useVersion)')
    .option('--run <value>', 'Command to run after the release is successful. (arg: run)')
    .option('--pre-run <value>', 'Command to run after the release is successful. (arg: preRun)')
    .option('--publish', 'Publish the package to npm, requires npm already set up and authenticated. (arg: publish)')
    .option('--github-token <value>', 'GitHub token to use for creating the release. By default, we use GITHUB_TOKEN environment variable (arg: githubToken)')
    .option('--skip-release', 'Skips creating a release on GitHub. (arg: skipRelease)')
    .option('--verbose', 'Enables verbose mode. (arg: verbose)')
    .parse(process.argv);

const options = program.opts();

// remove falsy values from the overrides
if (options) {

    Object.keys(options).forEach((key) => (
        // @ts-ignore
        !options[key] && delete options[key]
    ));

}

const config = getConfig(options);

autorel(config).catch((err) => {

    logger.error(`Release failed:\n${formatSerializedError(serializeError(err))}`);
    process.exit(1);

});
