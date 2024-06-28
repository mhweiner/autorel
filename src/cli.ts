import {Command} from 'commander';
import * as packageJson from '../package.json';
import {bold} from './lib/colors';
import {run} from './run';
import output from './lib/output';

const program = new Command();

console.log('----------------------------');
console.log(`${bold('⚙️ autorel ')}v${packageJson.version}`);
console.log('----------------------------');

program
    .version(packageJson.version, '-v, --version')
    .description('An example CLI for managing a directory')
    .option('--github-token  [value]', 'Provide GitHub Token')
    .option('-d, --dry', 'Do a dry run')
    .option('-p, --pre <value>', 'Pre-release channel')
    .option('-t, --tag <value>', 'Specify a tag to be used instead of calculating it from commit analysis')
    .option('-r, --run <value>', 'Bash script to run after the release is successful')
    .parse(process.argv);

const options = program.opts();

output.debug(`Options: ${JSON.stringify(options, null, 2)}`);

run({
    githubToken: options.githubToken,
    dryRun: options.dry,
    postReleaseBashScript: options.run,
    prereleaseChannel: options.pre,
    tag: options.tag,
});
