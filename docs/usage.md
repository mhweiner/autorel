# Usage

## Table of Contents

- [Configuration Options](#configuration-options)
- [Sample YAML Configuration](#sample-yaml-configuration)
- [GitHub Permissions](#github-permissions)
- [Usage with GitHub Actions](#usage-with-github-actions)
- [NPM Permissions](#npm-permissions)
- [About package.json versions](#about-packagejson-versions)
- [Usage with Other Repositories (not GitHub)](#usage-with-other-repositories-not-github)
- [Usage with Other Languages (not Node.js)](#usage-with-other-languages-not-nodejs)
- [Using `autorel` as a library](#using-autorel-as-a-library)
- [Types](#types)

## Configuration Options

When run in CLI mode, `autorel` can be configured via CLI arguments or a `yaml` file. CLI arguments take precedence over the `yaml` file. All parameters are optional.

However, omitting optional binary flags, such as the `--publish`, `--dry-run`, `--skip-release`, and `--verbose` flags will still publish to NPM if set in the `yaml` file.

If you want to use `autorel` as a library, see [this](./usage-library.md).

> ❗️ The `yaml` configuration file must be named `.autorel.yaml` and be in the root of your project.

[See sample YAML configuration](#sample-yaml-configuration)

### publish

Whether to publish the release to NPM. If `true`, you must be authenticated with NPM. To do so via GitHub Actions, see [this](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry).

- CLI: `--publish`
- Argument: `publish: boolean`
- Default: `false`

### dryRun

Whether to run in dry-run mode. This will not push the tag, create the release, publish to NPM, or run the command.

- CLI: `--dry-run`
- Argument: `dryRun: boolean`
- Default: `false`

### verbose

Whether to run in verbose mode. This will output more information about the release process.

- CLI: `--verbose`
- Argument: `verbose: boolean`
- Default: `false`

### skipRelease

Whether to skip creating a release on GitHub. If `true`, the release will not be created, but the tag will still be pushed and the package on npm will still be updated, if applicable.

- CLI: `--skip-release`
- Argument: `skipRelease: boolean`
- Default: `false`

### run

A `bash` command/script to run after the release is complete. All scripts are run in "-e" mode, meaning they will exit on the first error.

The following environment variables are available:

| Variable | Description |
| --- | --- |
| `NEXT_VERSION` | The new version number (without the `v`) |
| `NEXT_TAG` | The new tag, ie. v3.1.0 |

Example CLI usage:

```bash
npx autorel --run 'echo "Next version is ${NEXT_VERSION}"'
```

Example YAML usage:

```yaml
run: echo "Next version is ${NEXT_VERSION}"
```

You can use the multi-line string syntax in YAML to write a script:

```yaml
run: |
  echo "$(date +"%Y-%m-%d") ${NEXT_VERSION}" >> versions.txt
  aws s3 sync . s3://my-bucket
```

- CLI: `--run`
- Argument: `run: string`
- Default: `undefined`

### preRun

A `bash` command/script to run before the release is started. All scripts are run in "-e" mode, meaning they will exit on the first error. Here's where you can do things like run tests or do build steps.

This could save you time and money by not running unnecessary steps in your CI/CD pipeline. It will not run if no release is determined to be necessary, and it will not run in dry-run mode.

This is run *after* determining the new version number but *before* pushing tags, creating the release on GitHub, updating the package.json, or publishing to NPM. 

Example YAML usage: 

```yaml
preRun: |
  npm ci
  npm run build
  npm run test
  npm run lint
```

- CLI: `--pre-run`
- Argument: `preRun: string`
- Default: `undefined`

### preRelease

> ❗️ This is typically set via the `branches` configuration (recommended), but can be overridden here.

The pre-release channel to use. This will be appended to the version number. For example, if the version is `1.0.0` and the pre-release is `alpha`, the version will be `1.0.0-alpha.1`. For "production" releases, the "latest" tag will be used for NPM.

- CLI: `--pre-release`
- Argument: `preRelease: string`
- Default: `undefined`

### useVersion

The version to use for the release INSTEAD of the version being generated. Always results in a release being created unless `noRelease` is `true`. **Advanced usage only, not recommended for most users.**

- CLI: `--use-version`
- Argument: `useVersion: string`
- Default: `undefined`

> ❗️ Must be a valid SemVer version, without the `v`.

### githubToken

The GitHub token to use for creating the release. If not provided, it will use the `GITHUB_TOKEN` environment variable. This is only used if `skipRelease` is `false`.


### breakingChangeTitle (YAML/library only)

The title to use for the breaking changes section in the release notes.

- Argument: `breakingChangeTitle: string`
- Default: `"🚨 Breaking Changes 🚨"`

### commitTypes (YAML/library only)

The commit types to use for both the release notes and version bumping.

- Argument: `commitTypes: CommitType[]`
- Defaults: [src/defaults.ts](src/defaults.ts)

### branches (YAML/library only)

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


## Sample YAML Configuration

<sub>_.autorel.yaml_</sub>
```yaml
# Define the branches and their respective channels
branches:
  - {name: 'main'}
  - {name: 'next', prereleaseChannel: 'next'}

# Enable publishing to NPM
publish: true

# Run custom script after publish
run: |
  echo "$(date +"%Y-%m-%d") ${NEXT_VERSION}" >> versions.txt
  aws s3 sync . s3://my-bucket
```

## GitHub Permissions

In order for `autorel` to create releases and publish to GitHub's npm registry, you'll need to make sure you have the appropriate access/permissions.

If you're using GitHub Actions, see [Using `autorel` with GitHub Actions](/docs/github-actions.md#permissions) for more information.

If you're running it locally (or using a different CI/CD system), you can pass your [GitHub Personal Access Token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) either by setting the `GITHUB_TOKEN` environment variable or by passing the `--github-token (githubToken: string)` flag.

## Usage with GitHub Actions

Autorel 💜 GitHub Actions! Here is a sample configuration:

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
      - run: npx autorel@^2
        env:
            GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
            NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

It's also recommended you create a `.autorel.yaml` file in the root of your project to [configure](/docs/configuration.md) `autorel`.

> ❗️ You must set `fetch-depth: 0` and `fetch-tags: true` in `actions/checkout@v4` (or later) or autorel will not work correctly.

> ❗️ You must be authenticated with npm to publish. To do so via GitHub Actions, see [this](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry).

## NPM Permissions

In order to publish to npm, you'll need to be authenticated. You can do this by either:

1. Running `npm login` locally
2. Setting the `NODE_AUTH_TOKEN` environment variable to your npm token

If you're using GitHub Actions, see [this guide](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry) for setting up npm authentication.

> ❗️ Make sure your npm token has the appropriate permissions to publish packages.

## About package.json versions

If using our npm publishing feature, the package.json file's version will be updated in memory before being pushed to npm, as this is the only place where it's actually required. The change will not be pushed to the repository, as it is not necessary and could cause conflicts. See [this post](https://semantic-release.gitbook.io/semantic-release/support/faq)

If you need access to the new version number in your CI/CD pipeline, you can use the `NEXT_VERSION` or `NEXT_TAG` environment variables.

## Usage with Other Repositories (not GitHub)

`autorel` is designed to work with any CI/CD system, not just GitHub Actions. You can use it with GitLab, Bitbucket, Jenkins, or any other system that supports running shell commands and meets our [system requirements](#system-requirements).

Simply use the `--skip-release` flag (arg: `skipRelease: true`) to skip creating a release on GitHub. Then, you can use the `--run` flag (arg: `run: string`) to run any command or script after the version bump with the new version number available as an environment variable [see below](#run).

If you're interested in contributing built-in support for other systems, please open an issue or PR.

## Usage with Other Languages (not Node.js)

`autorel` is designed to work with any language or platform. You can use it with Python, Ruby, Go, Java, or any other language.

Simply omit the `--publish` flag (arg: `publish: false`, which is default) to skip publishing to NPM. Then, you can use either the `--run` flag (arg: `run: string`) or `runScript: string` arg to run any command or script after the version bump with the new version number available as an environment variable [see below](#run).

If you're interested in contributing built-in support for other systems, please open an issue or PR.

## Using `autorel` as a library

### Example Usage

1. Install `autorel` as a dependency

    ```bash
    npm i autorel
    ```

2. Import and use in your project to build custom release tooling

Example:

    ```typescript
    import {autorel, defaultConfig} from 'autorel';

    const autorelConfig = {
      ...defaultConfig,
      publish: true,
    };

    autorel(autorelConfig).then((nextVersion) => {
        console.log(`Next version is ${nextVersion}`); // ie, "Next version is 1.0.1"
    });
    ```

### Configuration

When used as a library, you pass the configuration directly to the `autorel` function. When used this way, it will not automatically load any default configuration&mdash;you can use the `defaultConfig` object to get the default configuration:

```typescript
import {autorel, defaultConfig} from 'autorel';

autorel(defaultConfig).then((nextVersion) => {
    console.log(`Next version is ${nextVersion}`); // ie, "Next version is 1.0.1"
});
```

## Types

You can find the types defined at [src/index.ts](src/index.ts).
