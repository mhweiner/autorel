import {$} from './bash';

export type Commit = {
    hash: string
    message: string
};

export function createAndPushTag(tag: string): void {

    $`git tag ${tag}`;
    $`git push origin ${tag}`;

}

export function getLastTag(): string {

    return $`git tag | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -n 1` || 'none';

}

export function getLastProdTag(): string {

    return $`git tag --list | grep -E "^v[0-9]+\\.[0-9]+\\.[0-9]+$" | sort -V | tail -n 1` || 'none';

}

export function getRepoParts(): {owner: string, repository: string} {

    const url = $`git remote get-url origin`;
    const regex = /^git@github\.com:(.+)\/(.+)\.git$/;
    const matches = url.match(regex);

    if (!matches) throw new Error('The git repo URL does not match the expected pattern.');

    const username = matches[1];
    const repository = matches[2];

    return {owner: username, repository};

}

export function getCommitsSinceLastTag(lastTag: string): Commit[] {

    const format = '<commit><hash>%h</hash><message>%B</message></commit>';
    const rawLog = lastTag !== 'none'
        ? $`git log --pretty=format:"${format}" ${lastTag}..HEAD`
        : $`git log --pretty=format:"${format}"`;
    const commitsXml = rawLog.match(/<commit>.*?<\/commit>/gs);

    if (!commitsXml) return [];

    return commitsXml.map((commitXml) => {

        const hash = commitXml.match(/<hash>(.*?)<\/hash>/)?.[1].trim() || '';
        const message = commitXml.match(/<message>(.*?)<\/message>/s)?.[1].trim() || '';

        return {hash, message};

    });

}

