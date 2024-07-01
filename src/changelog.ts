import {CommitType} from '.';
import {ConventionalCommit, filterBreakingCommits, groupCommits} from './conventionalcommits';

export function generateChangelog(
    commits: ConventionalCommit[],
    commitTypeMap: Map<string, CommitType>,
    breakingTitle = 'Breaking Changes'
): string {

    const groupedCommits = groupCommits(commits);
    const breakingCommits = filterBreakingCommits(commits);
    const entries = Object.entries(groupedCommits)
        .map(([type, commits]) => {

            const title = commitTypeMap.get(type)?.title || type;

            return `## ${title}\n\n${commits.map((commit) => `- ${commit.description} (${commit.hash})`).join('\n')}`;

        })
        .join('\n\n');
    const breaking = breakingCommits.length
        ? `## ${breakingTitle}\n\n${breakingCommits.map((commit) => `- ${commit.description} (${commit.hash})`).join('\n')}\n\n`
        : '';

    return `${breaking}${entries}`;

}
