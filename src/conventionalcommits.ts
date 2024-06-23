import {inspect} from 'node:util';
import {ReleaseType} from '.';
import * as color from './colors';

export type ConventionalCommit = {
    hash: string
    type: string
    scope?: string
    description: string
    body?: string
    footers: string[]
    breaking: boolean
};

// eslint-disable-next-line max-lines-per-function
export function parseConventionalCommit(
    commitMessage: string,
    hash: string
): ConventionalCommit {

    const lines = commitMessage.split('\n');
    const header = lines[0];

    // Extract type, scope, and description from the header
    const headerPattern = /^(?<type>[\w]+)(?<breaking>!)?(\((?<scope>[^)]+)\))?(?<breakingAlt>!)?: (?<description>.+)$/;
    const headerMatch = header.match(headerPattern);

    if (!headerMatch || !headerMatch.groups) {

        throw new Error('Invalid conventional commit message');

    }

    const {type, scope, breaking, breakingAlt, description} = headerMatch.groups;

    // Extract body and footers
    const bodyLines = lines.slice(1);
    const footers: string[] = [];
    let body = '';

    let inFooter = false;
    const footerPattern = /^(BREAKING CHANGE(S?)|[a-zA-Z-]+): (.+)$/;

    bodyLines.forEach((line) => {

        if (footerPattern.test(line)) {

            inFooter = true;
            footers.push(line);

        } else if (inFooter) {

            footers[footers.length - 1] += `\n${line}`;

        } else {

            body = body ? `${body}\n${line}` : line;

        }

    });

    return {
        type,
        scope,
        description,
        body: body?.trim(),
        footers,
        breaking: !!(breaking || breakingAlt),
        hash,
    };

}

export function determineCommitReleaseType(
    commit: ConventionalCommit,
    commitTypeMap: Map<string, {release: ReleaseType}>
): ReleaseType {

    if (commit.breaking) return 'major';

    return commitTypeMap.get(commit.type)?.release || 'none';

}

export function determineReleaseType(
    commits: ConventionalCommit[],
    commitTypeMap: Map<string, {release: ReleaseType}>
): ReleaseType {

    const releaseTypes = commits.map((commit) => {

        process.env.AUTOREL_DEBUG && console.log(color.yellow('[autorel debug] Analyzing commit:'), inspect(commit, {
            depth: null,
            colors: true,
        }));

        const releaseType = determineCommitReleaseType(commit, commitTypeMap);
        const releaseTypeStr = (releaseType === 'none' && color.grey('none'))
            || (releaseType === 'major' && color.red('major'))
            || (releaseType === 'minor' && color.yellow('minor'))
            || (releaseType === 'patch' && color.green('patch'));

        console.log(`[autorel] Release type: ${releaseTypeStr}`);

        return releaseType;

    });

    if (releaseTypes.includes('major')) return 'major';
    if (releaseTypes.includes('minor')) return 'minor';
    if (releaseTypes.includes('patch')) return 'patch';

    return 'none';

}

export function groupCommits(commits: ConventionalCommit[]): Record<string, ConventionalCommit[]> {

    return commits.reduce((acc: Record<string, ConventionalCommit[]>, commit) => {

        if (!acc[commit.type]) acc[commit.type] = [];

        acc[commit.type].push(commit);

        return acc;

    }, {});

}

export function filterBreakingCommits(commits: ConventionalCommit[]): ConventionalCommit[] {

    return commits.filter((commit) => commit.breaking);

}
