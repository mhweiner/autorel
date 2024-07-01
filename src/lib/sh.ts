import {execSync} from 'child_process';
import out from './output';

export function $(strings: TemplateStringsArray, ...values: any[]): string {

    const command = strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');

    out.debug(command);

    const escapedCommand = command.replace(/(["$`\\])/g, '\\$1').replace(/\n/g, '\\n');
    const output = execSync(`bash -c "${escapedCommand}"`, {encoding: 'utf8'});

    return output.trim();

}

export function bash(cmd: string): void {

    const escapedCommand = cmd.replace(/(["$`\\])/g, '\\$1').replace(/\n/g, '\\n');

    execSync(`bash -c "${escapedCommand}"`, {encoding: 'utf8', stdio: 'inherit'});

}

export function cmd(cmd: string): void {

    execSync(cmd, {encoding: 'utf8', stdio: 'inherit'});

}
