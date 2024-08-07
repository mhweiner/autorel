<picture>
    <source srcset="docs/autorel.svg" media="(prefers-color-scheme: dark)">
    <source srcset="docs/autorel-dark.svg" media="(prefers-color-scheme: light)">
    <img src="docs/autorel-dark.svg" alt="Autorel" size="250">
</picture>

[![build status](https://github.com/mhweiner/autorel/actions/workflows/release.yml/badge.svg)](https://github.com/mhweiner/autorel/actions)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)](https://semver.org)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![autorel](https://raw.githubusercontent.com/mhweiner/autorel/main/badge.svg)](https://github.com/mhweiner/autorel)

Automate releases based on [SemVer](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Like `semantic-release` and `release-please` but simpler and faster.

Autorel automatically does the following, if appropriate:

- Bumps the version based on the commit messages
- Creates a new release on GitHub with Release Notes
- Publishes the package to NPM
- Runs any arbitrary command or bash script

_Currently only has built-in support for `GitHub` and `NPM`, but you can write your own scripts to support other systems and languages._

**✅ Conventional Commit and SemVer Compliant** 
- 100% compliant with Conventional Commits and SemVer out of the box, including "!" for breaking changes

**😃 Simple & Easy to Use**
- No confusing configuration files or complex setup
- Works with any CI/CD system, including GitHub Actions
- Works with any language or platform
- Built-in bash script support

**🚀 Fast & Lightweight**
- Minimal dependencies and fast execution written in TypeScript
- Comprehensive test coverage
- Less broken builds and more time to focus on your code!

[Read our FAQ on why you should use `autorel` and how it compares to other tools](docs/faq.md)

# Table of Contents

- [Example Usage (CLI)](#example-usage-cli)
- [Example Usage (Library)](#example-usage-library)
- [Commit Messages](#commit-messages)
- [Usage with GitHub Actions](#usage-with-github-actions)
- [Usage with Other Repositories (not GitHub)](#usage-with-other-repositories-not-github)
- [Usage with Other Languages (not Node.js)](#usage-with-other-languages-not-nodejs)
- [Configuration](#configuration)
- [Sample YAML Configuration](#sample-yaml-configuration)
- [Types](#types)
- [Debug Mode](#debug-mode)
- [About package.json versions](#about-packagejson-versions)
- [FAQ](docs/faq.md)
- [Support, Feedback, and Contributions](#support-feedback-and-contributions)
- [License](#license)

# Example Usage (CLI)

```bash
npx autorel --publish --run 'echo "Next version is ${NEXT_VERSION}"'
```

This will:

1. Bump the version based on the commit messages since the last release
2. Create a new release on GitHub with Release Notes
3. Update package.json and publish the release to NPM (does not commit the change to the repository, see below)
4. Run the command `echo "Next version is ${NEXT_VERSION}"`

You can also install `autorel` globally and run it directly:

```bash
npm i -g autorel
autorel --publish
```

## Avoiding Breaking Changes

If using the `npx` command, you may want to append the version number to prevent breaking changes in the future. You can do this by appending `@^` followed by the major version number.

Example: `npx autorel@^2`

# Example Usage (Library)

1. Install `autorel` as a dependency

    ```bash
    npm i autorel
    ```

2. Import and use in your project

    ```typescript
    import {autorel} from 'autorel';

    autorel({publish: true}).then((nextVersion) => {
        console.log(`Next version is ${nextVersion}`);
    });
    ```

# Commit Messages

Commit messages are parsed to determine the version bump. They must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard specification.

Here are some examples of commit messages and the resulting [SemVer](https://semver.org) version bump (with default configuration):

- `fix: fix a bug` -> `0.0.1`
- `feat: add new feature` -> `0.1.0`
- `feat!: add breaking change` -> `1.0.0`

You can find more examples in the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) documentation.

# Usage with GitHub Actions

You can use `autorel` with GitHub Actions to automate your releases (recommended). 

> ❗️ You must set `fetch-depth: 0` and `fetch-tags: true` in `actions/checkout@v4` (or later) or autorel will not work correctly.

> ❗️ You must be authenticated with NPM to publish. To do so via GitHub Actions, see [this](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry).

Here is a sample configuration:

```yaml
name: Release
on:
  push:
    branches: [main, alpha, beta]
jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          fetch-tags: true
      - uses: actions/setup-node@v4
        with:
          node-version: latest
          registry-url: "https://registry.npmjs.org"
          cache: 'npm'
      - uses: actions/cache@v3
        id: cache-node-modules
        with:
          path: node_modules
          key: ${{runner.os}}-node-${{hashFiles('package-lock.json')}}
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npx autorel --publish
        env:
            GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
            NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

It's also recommended you create a `.autorel.yaml` file in the root of your project to [configure](#configuration) `autorel`.

# Usage with Other Repositories (not GitHub)

`autorel` is designed to work with any CI/CD system, not just GitHub Actions. You can use it with GitLab, Bitbucket, Jenkins, or any other system that supports running shell commands.

Simply use the `--skip-release` flag (arg: `skipRelease: true`) to skip creating a release on GitHub. Then, you can use either the `--run` flag (arg: `run: string`) or `runScript` arg to run any command or script after the version bump with the new version number available as an environment variable [see below](#run).

If you're interested in contributing built-in support for other systems, please open an issue or PR.

# Usage with Other Languages (not Node.js)

`autorel` is designed to work with any language or platform. You can use it with Python, Ruby, Go, Java, or any other language.

Simply omit the `--publish` flag (arg: `publish: false`, which is default) to skip publishing to NPM. Then, you can use either the `--run` flag (arg: `run: string`) or `runScript: string` arg to run any command or script after the version bump with the new version number available as an environment variable [see below](#run).

If you're interested in contributing built-in support for other systems, please open an issue or PR.

# Configuration

When run in CLI mode, `autorel` can be configured via CLI arguments or a `yaml` file. CLI arguments take precedence over the `yaml` file. 

However, omitting the `--publish` flag will still publish to NPM if `publish: true` is set in the `yaml` file, and the same for other binary flags.

When used as a library, you can pass the configuration directly to the `autorel` function.

All arguments are optional, but setting `branches` is recommended.

> ❗️ The `yaml` configuration file must be named `.autorel.yaml` and be in the root of your project.

[See sample YAML configuration](#sample-yaml-configuration)

## publish

Whether to publish the release to NPM. If `true`, you must be authenticated with NPM. To do so via GitHub Actions, see [this](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry).

- CLI: `--publish`
- Argument: `publish: boolean`
- Default: `false`

## dryRun

Whether to run in dry-run mode. This will not push the tag, create the release, publish to NPM, or run the command.

- CLI: `--dry-run`
- Argument: `dryRun: boolean`
- Default: `false`

## skipRelease

Whether to skip creating a release on GitHub. If `true`, the release will not be created, but the tag will still be pushed and the package on npm will still be updated, if applicable.

- CLI: `--skip-release`
- Argument: `skipRelease: boolean`
- Default: `false`

## run

A command to run after the release is complete. The following environment variables are available:

| Variable | Description |
| --- | --- |
| `NEXT_VERSION` | The new version number (without the `v`) |
| `NEXT_TAG` | The new tag, ie. v3.1.0 |

- CLI: `--run`
- Argument: `run: string`
- Default: `undefined`

## runScript (YAML only)

A bash script to run after the release is complete. The same environment variables are available as above.

> ❗️ This requires `bash` to be installed on the system.

You can use the multi-line string syntax in YAML to write a script:

```yaml
runScript: |
  echo 'Hello, World!' > hello.txt
  echo 'Goodbye, World!' > goodbye.txt
```

- Argument: `runScript: string`
- Default: `undefined`

## preRelease

> ❗️ This is typically set via the `branches` configuration (recommended), but can be overridden here.

The pre-release channel to use. This will be appended to the version number. For example, if the version is `1.0.0` and the pre-release is `alpha`, the version will be `1.0.0-alpha.1`. For "production" releases, the "latest" tag will be used for NPM.

- CLI: `--pre-release`
- Argument: `preRelease: string`
- Default: `undefined`

## breakingChangeTitle (YAML only)

The title to use for the breaking changes section in the release notes.

- Argument: `breakingChangeTitle: string`
- Default: `"🚨 Breaking Changes 🚨"`

## commitTypes (YAML only)

The commit types to use for both the release notes and version bumping. If not provided, the default commit types can be found in [src/defaults.ts](src/defaults.ts).

- Argument: `commitTypes: CommitType[]`

## branches (YAML only)

The branches to use for the release along with their pre-release channel. If not provided, the default is:

```yaml
- {name: 'main'}
```

The above will release to the `latest` channel on NPM. If you want to release to a different channel (making it a pre-release), you can specify it like so:

```yaml
branches:
  - {name: 'main'}
  - {name: 'develop', prereleaseChannel: 'alpha'}
  - {name: 'staging', prereleaseChannel: 'beta'}
```

The above will release to the `latest` channel (production) on NPM for the `main` branch, the `alpha` pre-release channel for the `develop` branch, and the `beta` pre-release channel for the `staging` branch.

- Argument: `branches: ReleaseBranch[]`

## useVersion

The version to use for the release INSTEAD of the version being generated. Always results in a release being created unless `noRelease` is `true`. **Advanced usage only, not recommended for most users.**

- CLI: `--use-version`
- Argument: `useVersion: string`
- Default: `undefined`

> ❗️ Must be a valid SemVer version, without the `v`.

# Sample YAML Configuration

<sub>_.autorel.yaml_</sub>
```yaml
# Define the branches and their respective channels
branches:
  - {name: 'main'}
  - {name: 'next', prereleaseChannel: 'next'}

# Enable publishing to NPM
publish: true

# Run custom script after publish
runScript: |
  echo "$(date +"%Y-%m-%d") ${NEXT_VERSION}" >> versions.txt
  aws s3 sync . s3://my-bucket
```

# Types

You can find the types defined at [src/index.ts](src/index.ts).

# Debug Mode

To enable debug mode, set `AUTOREL_DEBUG=1`:

```bash
AUTOREL_DEBUG=1 npx autorel
```

This will output configuration and other debug information.

# About package.json versions

If using our npm publishing feature, the package.json file's version will be updated in memory before being pushed to npm, as this is the only place where it's actually required. The change will not be pushed to the repository, as it is not necessary and could cause conflicts. See [this post](https://semantic-release.gitbook.io/semantic-release/support/faq)

# Support, Feedback, and Contributions

- Star this repo if you like it!
- Submit an [issue](https://github.com/mhweiner/autorel/issues) with your problem, feature request or bug report
- Issue a PR against `main` and request review. Make sure all tests pass and coverage is good.
- Write about `autorel` in your blog, tweet about it, or share it with your friends!
- Support this package by adding our badge to your README:

```markdown
[![autorel](https://raw.githubusercontent.com/mhweiner/autorel/main/badge.svg)](https://github.com/mhweiner/autorel)
```

## License

MIT &copy; Marc H. Weiner

[See full license](LICENSE)

## Sponsors

<picture>
    <source srcset="docs/aeroview-logo-lockup.svg" media="(prefers-color-scheme: dark)">
    <source srcset="docs/aeroview-logo-lockup-dark.svg" media="(prefers-color-scheme: light)">
    <img src="docs/aeroview-logo-lockup-dark.svg" alt="Logo" style="max-width: 150px;margin: 0 0 10px">
</picture>

Aeroview is a developer-friendly, AI-powered observability platform that helps you monitor, troubleshoot, and optimize your applications. Get started for free at [https://aeroview.io](https://aeroview.io).