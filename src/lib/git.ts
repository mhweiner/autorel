import {$} from './sh';

export type Commit = {
    hash: string
    message: string
};

export function gitFetchTags(): void {

    $`git fetch`;

}

export function createAndPushTag(tag: string): void {

    $`git tag ${tag}`;
    $`git push origin ${tag}`;

}

/**
 * Get the last tag. It does this by:
 * 1. Getting all tags
 * 2. Filtering out tags that are not in the format v1.2.3
 * 3. Sorting the tags by version number by tricking the sort -V command by appending an
 *   underscore to tags that do not have a hyphen in them (i.e. they are not pre-release tags)
 *   Thanks to this StackOverflow answer: https://stackoverflow.com/questions/40390957/how-to-sort-semantic-versions-in-bash
 * 4. Removing the underscore from the sorted tags
 * 5. Getting the last tag
 */
export function getLastTag(): string {

    return $`git tag | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+' | sed '/-/!s/$/_/' | sort -V | sed 's/_$//' | tail -n 1` || '';

}

export function getLastProdTag(): string {

    return $`git tag --list | grep -E "^v[0-9]+\\.[0-9]+\\.[0-9]+$" | sort -V | tail -n 1` || '';

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

export function getCommitsSinceLastTag(lastTag: string): Commit[] {

    const format = '<commit><hash>%h</hash><message>%B</message></commit>';
    const rawLog = lastTag !== ''
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

export function getCurrentBranch(): string {

    return $`git rev-parse --abbrev-ref HEAD`;

}

