import {$, fetch} from 'zx';

const breakingTitle = '💥 Breaking Changes';
const types = {
    feat: {title: '✨ Features', release: 'minor'},
    fix: {title: '🐛 Bug Fixes', release: 'patch'},
    perf: {title: '⚡ Performance Improvements', release: 'patch'},
    revert: {title: '⏪ Reverts', release: 'patch'},
    docs: {title: '📚 Documentation', release: 'patch'},
    style: {title: '💅 Styles', release: 'patch'},
    refactor: {title: '🛠 Code Refactoring', release: 'patch'},
    test: {title: '🧪 Tests', release: 'patch'},
    build: {title: '🏗 Build System', release: 'patch'},
    ci: {title: '🔧 Continuous Integration', release: 'patch'},
};

async function main() {

    /*
    const lastTag = await getLastTag(); // v1.0.0
    const commits = await getCommitsSinceTag(lastTag); // [{type: 'feat', message: 'Add new feature'}, ...]
    const groupedCommits = groupCommits(commits); // {feat: [], fix: [], ...}
    const releaseType = getReleaseType(groupedCommits); // major, minor, patch
    const nextVersion = getNextVersion(lastTag, releaseType); // v1.1.0
    const changelog = generateChangelog(groupedCommits);

    await createTag(nextVersion);
    await createRelease(lastTag, releaseType, changelog);
    await publishPackage(releaseType);
    */

}

async function getLastTag(): Promise<string> {

    const {stdout} = await $`git describe --abbrev=0 --tags`;

    return stdout.trim();

}

async function getCommitsSinceTag(tag: string): Promise<string[]> {

    // Get git remote url
    const {stdout: url} = $.sync`git remote get-url origin`;

    // Parse the remote url to get the repository name and owner
    const repository = url.replace(/.*github.com\/(.*)\.git/, '$1');
    const owner = url.replace(/.*github.com\/(.*)\/.*/, '$1');

    // Get all commits from GitHub since the last tag
    const commits = await fetch(`https://api.github.com/repos/${owner}/${repository}/commits?sha=${tag}`, {
        headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
    const commitsJson = await commits.json();

    return commitsJson.map((commit: any) => commit.commit.message);

}

getCommitsSinceTag('v1.0.0').then(console.log);
