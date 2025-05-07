import {inspect} from 'node:util';
import output from './lib/output';
import {CommitType} from '.';
import {dim, greenBright, redBright, yellowBright} from 'colorette';

type ReleaseType = 'major' | 'minor' | 'patch' | 'none';

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
): ConventionalCommit|undefined {

    const lines = commitMessage.split('\n');
    const header = lines[0];

    // Extract type, scope, and description from the header
    const headerPattern = /^(?<type>[\w]+)(?<breaking>!)?(\((?<scope>[^)]+)\))?(?<breakingAlt>!)?: (?<description>.+)$/;
    const headerMatch = header.match(headerPattern);

    if (!headerMatch || !headerMatch.groups) {

        return undefined;

    }

    const {type, scope, breaking, breakingAlt, description} = headerMatch.groups;

    // Extract body and footers
    const bodyLines = lines.slice(1);
    const footers: string[] = [];
    let body = '';

    let inFooter = false; // Whether we are currently parsing a footer
    let breakingFooterDetected = false; // Whether we have detected a breaking change footer
    const footerPattern = /^(BREAKING CHANGE(S?)|[a-zA-Z-]+): (.+)$/;

    bodyLines.forEach((line) => {

        if (footerPattern.test(line)) {

            inFooter = true;
            footers.push(line);

            // test for breaking change
            if (/^BREAKING CHANGE(S)?(.+)$/.test(line)) {

                breakingFooterDetected = true;

            }

        } else if (inFooter) {

            // Append to the last footer
            footers[footers.length - 1] += `\n${line}`;

        } else {

            // Append to the body
            body = body ? `${body}\n${line}` : line;

        }

    });

    return {
        type,
        scope,
        description,
        body: body.trim(),
        footers,
        breaking: !!(breaking || breakingAlt || breakingFooterDetected),
        hash,
    };

}

function determineCommitReleaseType(
    commit: ConventionalCommit,
    commitTypeMap: Map<string, CommitType>
): ReleaseType {

    if (commit.breaking) return 'major';

    return commitTypeMap.get(commit.type)?.release || 'none';

}

export function determineReleaseType(
    commits: ConventionalCommit[],
    commitTypeMap: Map<string, CommitType>
): ReleaseType {

    const releaseTypes = commits.map((commit) => {

        output.debug('Analyzing commit:');
        output.debug(inspect(commit, {
            depth: null,
            colors: false,
        }));

        const releaseType = determineCommitReleaseType(commit, commitTypeMap);
        const releaseTypeStr = (releaseType === 'none' && dim('none'))
            || (releaseType === 'major' && redBright('major'))
            || (releaseType === 'minor' && yellowBright('minor'))
            || (releaseType === 'patch' && greenBright('patch'));

        output.debug(`Release type: ${releaseTypeStr}`);

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
