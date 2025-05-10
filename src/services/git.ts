import {$} from './sh';

export type Commit = {
    hash: string
    message: string
};

export function gitFetch(): void {

    $`git fetch`;

}

export function createAndPushTag(tag: string): void {

    $`git tag ${tag}`;
    $`git push origin ${tag}`;

}

export function getLatestTags(): string[] {

    const tags = $`git tag --sort=-v:refname | head -n 100`;

    return tags.split('\n').filter((tag) => tag.trim() !== '');

}

export function getRepo(): {owner: string, repository: string} {

    if (process.env.GITHUB_REPOSITORY) {

        const [owner, repository] = process.env.GITHUB_REPOSITORY.split('/');

        return {owner, repository};

    }

    const url = $`git remote get-url origin`;
    const regex = /^git@github\.com:(.+)\/(.+)\.git$/;
    const matches = url.match(regex);

    if (!matches) throw new Error('The git repo URL does not match the expected pattern.');

    const username = matches[1];
    const repository = matches[2];

    return {owner: username, repository};

}

export function getCommitsFromTag(tag?: string): Commit[] {

    const format = '<commit><hash>%h</hash><message>%B</message></commit>';
    const rawLog = tag
        ? $`git log --pretty=format:"${format}" ${tag}..HEAD`
        : $`git log --pretty=format:"${format}"`;
    const commitsXml = rawLog.match(/<commit>.*?<\/commit>/gs);

    if (!commitsXml) return [];

    return commitsXml.map((commitXml) => {

        const hash = commitXml.match(/<hash>(.*?)<\/hash>/)?.[1].trim() || '';
        const message = commitXml.match(/<message>(.*?)<\/message>/s)?.[1].trim() || '';

        return {hash, message};

    });

}

export function getCurrentBranch(): string {

    return $`git rev-parse --abbrev-ref HEAD`;

}

