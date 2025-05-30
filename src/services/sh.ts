import {execSync} from 'child_process';
import out from './logger';

/**
 * Executes a bash program/command and returns the output. This is a tagged template
 * literal function, so you can use it like this:
 *
 *   const output = $`echo "Hello, World!"`;
 *
 * Also, it logs the command/script to the console in debug mode.
 */
export function $(strings: TemplateStringsArray, ...values: any[]): string {

    const command = strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');

    out.debug(`> ${command}`);

    try {

        const escapedCommand = command.replace(/(["$`\\])/g, '\\$1');
        const output = execSync(`bash -c "${escapedCommand}"`, {encoding: 'utf8'});

        return output.trim();

    } catch (error: any) {

        // Extract the most relevant error information
        const errorMessage = error.stderr || error.message;
        const cleanError = errorMessage
            .split('\n')
            .filter((line: string) => line.trim() && !line.includes('at '))
            .join('\n')
            .trim();

        throw new Error(cleanError);

    }

}

/**
 * Executes a bash program/command but does not return the output. Is not a tagged template
 * literal function. You can use it like this:
 *
 * bash('echo "Hello, World!" > /dev/null');
 */
export function bash(cmd: string): void {

    const escapedCommand = cmd.replace(/(["$`\\])/g, '\\$1');

    execSync(`bash -e -c "${escapedCommand}"`, {encoding: 'utf8', stdio: 'inherit'});

}
