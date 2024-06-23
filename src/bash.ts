import {execSync} from 'child_process';

export function $(strings: TemplateStringsArray, ...values: any[]): string {

    const command = strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');

    const escapedCommand = command.replace(/(["$`\\])/g, '\\$1').replace(/\n/g, '\\n');
    const output = execSync(`bash -c "${escapedCommand}"`, {encoding: 'utf8'});

    return output.trim();

}
