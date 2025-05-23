import {gray, red, yellow} from 'colorette';

const prefix = '[autorel] ';

function info(message: string): void {

    console.log(`${prefix}${message}`);

}

function debug(message: string): void {

    process.env.AUTOREL_DEBUG && info(gray(message));

}

function warn(message: string): void {

    info(yellow(`Warning: ${message}`));

}

function error(message: string): void {

    console.error(red(`${prefix}Error: ${message}`));

}

export default {
    info,
    debug,
    warn,
    error,
};
