import {Command} from 'commander';
import {bold} from './lib/colors';
import {autorel} from '.';
import output from './lib/output';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const packageJson = require('../package.json');
const program = new Command();

console.log('----------------------------');
console.log(`${bold('⚙️ autorel ')}v${packageJson.version}`);
console.log('----------------------------');

program
    .version(packageJson.version, '-v, --version')
    .description('An example CLI for managing a directory')
    .option('--github-token  [value]', 'Provide GitHub Token')
    .option('--npm-token  [value]', 'Provide NPM Token')
    .option('-d, --dry', 'Do a dry run')
    .option('-p, --pre <value>', 'Pre-release channel. If specified, the release will be marked as a pre-release. Overrides any other configuration.')
    .option('-t, --tag <value>', 'Specify a tag to be used instead of calculating it from commit analysis. Overrides --pre.')
    .option('-r, --run <value>', 'Bash script to run after the release is successful')
    .option('--no-release', 'Does not create a release on GitHub (advanced use only)')
    .option('--publish', 'Publish the package to npm, requires passing --npm-token or NPM_TOKEN environment variable')
    .parse(process.argv);

const options = program.opts();

output.debug(`Options: ${JSON.stringify(options, null, 2)}`);

autorel({
    githubToken: options.githubToken,
    npmToken: options.npmToken,
    dryRun: options.dry,
    postReleaseBashScript: options.run,
    prereleaseChannel: options.pre,
    tag: options.tag,
    publish: options.publish,
    noRelease: options.noRelease,
});
