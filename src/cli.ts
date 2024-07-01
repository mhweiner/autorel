import {Command} from 'commander';
import {bold} from './lib/colors';
import {autorel} from '.';
import output from './lib/output';
import {getConfig} from './config';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const packageJson = require('../package.json');
const program = new Command();

console.log('----------------------------');
console.log(`${bold('⚙️ autorel ')}v${packageJson.version}`);
console.log('----------------------------');

program
    .version(packageJson.version, '-v, --version')
    .description('An example CLI for managing a directory')
    .option('--dry', 'Do a dry run')
    .option('--pre-release <value>', 'Pre-release channel. If specified, the release will be marked as a pre-release. Overrides any other configuration.')
    .option('--tag <value>', 'Specify a tag to be used instead of calculating it from commit analysis. Overrides --pre.')
    .option('--run <value>', 'Command to run after the release is successful')
    .option('--no-release', 'Does not create a release on GitHub (advanced use only)')
    .option('--publish', 'Publish the package to npm, requires passing --npm-token or NPM_TOKEN environment variable')
    .parse(process.argv);

const options = program.opts();
const config = getConfig();

output.debug(`Options: ${JSON.stringify(options, null, 2)}`);
output.debug(`Config: ${JSON.stringify(config, null, 2)}`);

autorel({
    ...config,
    dryRun: options.dry,
    run: options.run,
    prereleaseChannel: options.preRelease,
    tag: options.tag,
    publish: options.publish,
    noRelease: options.noRelease,
});
