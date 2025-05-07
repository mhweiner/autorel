import {dim, red, yellow} from 'colorette';

const prefix = '[autorel] ';

function log(message: string): void {

    console.log(`${prefix}${message}`);

}

function debug(message: string): void {

    process.env.AUTOREL_DEBUG && log(dim(message));

}

function warn(message: string): void {

    log(yellow(`Warning: ${message}`));

}

function error(message: string): void {

    log(red(`Error: ${message}`));

}

export default {
    log,
    debug,
    warn,
    error,
};
