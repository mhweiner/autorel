import {Config} from '.';
import logger from './lib/logger';
import {bash} from './services/sh';

export function runUserReleaseScripts(args: Config): void {

    if (args.run) {

        logger.info('Running post-release bash script...');
        bash(args.run);

    } else if (args.runScript) {

        // TODO: delete this block in the next major version

        logger.warn('----------------------------');
        logger.warn('🚨 The "runScript" option is deprecated. Please use "run" instead. 🚨');
        logger.warn('🚨 The "runScript" option will be removed in the next major version. 🚨');
        logger.warn('----------------------------');

        logger.info('Running post-release bash script...');
        bash(args.runScript);

    }

}
