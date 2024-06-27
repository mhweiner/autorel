import {grey, red, yellow} from './lib/colors';

const prefix = '[autorel] ';

function log(message: string): void {

    console.log(`${prefix}${message}`);

}

function debug(message: string): void {

    process.env.AUTOREL_DEBUG && console.log(grey(`${prefix}${message}`));

}

function warn(message: string): void {

    log(yellow(`${prefix}Warning: ${message}`));

}

function error(message: string): void {

    log(red(`${prefix}Error: ${message}`));

}

export default {
    log,
    debug,
    warn,
    error,
};
