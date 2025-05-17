# Usage

## Table of Contents

- [Configuration Options](/docs/configuration-options.md)
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

See [Configuration Options](/docs/configuration-options.md) for a reference of all configuration options.

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
