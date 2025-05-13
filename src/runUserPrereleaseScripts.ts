import {Config} from '.';
import logger from './lib/logger';
import {bash} from './services/sh';

export function runUserPreleaseScripts(args: Config): void {

    if (args.dryRun) return;
    if (!args.preRun) return;

    logger.info('Running pre-release bash script...');
    bash(args.preRun);


}
