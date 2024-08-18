import {Command} from 'commander';
import {bold} from './lib/colors';
import {autorel} from '.';
import output from './lib/output';
import {getConfig} from './config';

export type CliFlags = {
    dry?: boolean
    preRelease?: string
    useVersion?: string
    run?: string
    preRun?: string
    noRelease?: boolean
    publish?: boolean
};

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const packageJson = require('../package.json');
const program = new Command();

console.log('----------------------------');
console.log(`${bold('⚙️ autorel ')}v${packageJson.version}`);
console.log('----------------------------');

program
    .version(packageJson.version, '-v, --version')
    .description('An example CLI for managing a directory')
    .option('--dry-run', 'Do a dry run (arg: dryRun)')
    .option('--pre-release <value>', 'Pre-release channel. If specified, the release will be marked as a pre-release. Overrides branches configuration. (arg: preRelease)')
    .option('--use-version <value>', 'Specify a version to be used instead of calculating it from commit analysis. Must be a valid SemVer version, with no \'v\'. Overrides --pre-release, commitType, and branches configuration. (arg: useVersion)')
    .option('--run <value>', 'Command to run after the release is successful. (arg: run)')
    .option('--pre-run <value>', 'Command to run after the release is successful. (arg: preRun)')
    .option('--skip-release', 'Skips creating a release on GitHub. (arg: skipRelease)')
    .option('--publish', 'Publish the package to npm, requires passing --npm-token or NPM_TOKEN environment variable. (arg: publish)')
    .parse(process.argv);

const options = program.opts();
const cliOptions = {
    dryRun: options.dryRun,
    run: options.run,
    preRun: options.preRun,
    prereleaseChannel: options.preRelease,
    useVersion: options.useVersion,
    publish: options.publish,
    skipRelease: options.skipRelease,
};

output.debug(`CLI Options: ${JSON.stringify(cliOptions, null, 2)}`);

// remove falsy values from the overrides
if (cliOptions) {

    Object.keys(cliOptions).forEach((key) => (
        // @ts-ignore
        !cliOptions[key] && delete cliOptions[key]
    ));

}

const config = getConfig(cliOptions);

output.debug(`Config: ${JSON.stringify(config, null, 2)}`);

autorel(config);
