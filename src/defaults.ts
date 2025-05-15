import {Config} from '.';

export const defaultConfig: Config = {
    breakingChangeTitle: '🚨 Breaking Changes 🚨',
    commitTypes: [
        {type: 'feat', title: '✨ Features', release: 'minor'},
        {type: 'fix', title: '🐛 Bug Fixes', release: 'patch'},
        {type: 'perf', title: '🚀 Performance Improvements', release: 'patch'},
        {type: 'revert', title: '⏪ Reverts', release: 'patch'},
        {type: 'docs', title: '📚 Documentation', release: 'none'},
        {type: 'style', title: '💅 Styles', release: 'none'},
        {type: 'refactor', title: '🛠 Code Refactoring', release: 'none'},
        {type: 'test', title: '🧪 Tests', release: 'none'},
        {type: 'build', title: '🏗 Build System', release: 'none'},
        {type: 'ci', title: '🔧 Continuous Integration', release: 'none'},
    ],
    branches: [
        {name: 'main'},
    ],
    githubToken: process.env.GITHUB_TOKEN,
};
