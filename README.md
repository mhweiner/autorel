<picture>
    <source srcset="docs/autorel.svg?1" media="(prefers-color-scheme: dark)">
    <source srcset="docs/autorel-dark.svg?1" media="(prefers-color-scheme: light)">
    <img src="docs/autorel-dark.svg?1" alt="Autorel" style="margin: 0 0 10px" size="250">
</picture>

---

[![build status](https://github.com/mhweiner/autorel/actions/workflows/release.yml/badge.svg)](https://github.com/mhweiner/autorel/actions)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)]()

Automate releases based on [SemVer](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Like `semantic-release` and `release-please` but simpler, faster, and more flexible.

Autorel automatically does the following, if appropriate:

- Bumps the version based on the commit messages
- Creates a new release on GitHub with Release Notes
- Publishes the release to NPM
- Any other custom release steps you want to add

**✅ Conventional Commit and SemVer Compliant**
- Unlike some other tools, `autorel` is 100% compliant with Conventional Commits and SemVer out of the box, including "!" for breaking changes

**😃 Simple & Easy to Use**
- No confusing configuration files or complex setup
- Works with any CI/CD system, including GitHub Actions
- Out of the box TypeScript support

**💪 Flexible & Powerful**
- Use via `npx`, or import as a library
- If using CLI, supports both `yaml` configuration and arguments
- Highly customizable without being overly complex

# Table of Contents

- [Example Usage (CLI)](#example-usage-cli)
- [Example Usage (Library)](#example-usage-library)
- [Configuration](#configuration)
- [Sample YAML Configuration](#sample-yaml-configuration)
- [Types](#types)
- [Support, Feedback, and Contributions](#support-feedback-and-contributions)

# Example Usage (CLI)

```bash
npx autorel --publish --run 'echo "Next version is ${NEXT_VERSION}"'
```

This will:

1. Bump the version based on the commit messages since the last release (including pushing the tag and updating package.json)
2. Create a new release on GitHub with Release Notes
3. Publish the release to NPM
4. Run the command `echo "Next version is ${NEXT_VERSION}"`

You can also install `autorel` globally and run it that way:

```bash
npm i -g autorel
autorel --publish
```

# Example Usage (Library)

1. Install `autorel` as a dependency

    ```bash
    npm i autorel
    ```

2. Import and use in your project

    ```typescript
    import {autorel} from 'autorel';

    autorel({
      publish: true
      run: 'echo "Hello, World!"'
    });
    ```
This will do the same as the CLI example above.

# Configuration

When run in CLI mode, `autorel` can be configured via CLI arguments or a `yaml` file. CLI arguments take precedence over the `yaml` file.

When used as a library, you can pass the configuration directly to the `autorel` function. [See below](#types) for the types of configuration options.

All arguments are optional, but setting `branches` is recommended.

> ❗️ The `yaml` configuration file must be named `.autorel.yml` and be in the root of your project.

## help (CLI only)

Man page for the CLI

- CLI: `--help`

## publish

Whether to publish the release to NPM. If `true`, you must be authenticated with NPM. To do so via GitHub Actions, see [this](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry).

- CLI: `--publish`
- Argument: `publish: boolean`
- Default: `false`

## dryRun

Whether to run in dry-run mode. This will not push the tag, create the release, publish to NPM, or run the command.

- CLI: `--dry`
- Argument: `dryRun: boolean`
- Default: `false`

## noRelease

Whether to skip creating a release on GitHub. If `true`, the release will not be created, but the tag will still be pushed and the package on npm will still be updated, if applicable.

- CLI: `--no-release`
- Argument: `noRelease: boolean`
- Default: `false`

## run

A command to run after the release is complete. The following environment variables are available:

| Variable | Description |
| --- | --- |
| `NEXT_VERSION` | The next version number (without the `v`) |
| `NEXT_TAG` | The next tag |

- CLI: `--run`
- Argument: `run: string`
- Default: `undefined`

## runScript (YAML only)

A bash script to run after the release is complete. Environment variables are available as above.

> ❗️ This requires `bash` to be installed on the system.

You can use the multi-line string syntax in YAML to write a script:

```yaml
runScript: |
  echo 'Hello, World!' > hello.txt
  echo 'Goodbye, World!' > goodbye.txt
```

- Argument: `runScript: string`
- Default: `undefined`

## pre-release

The pre-release channel to use. This will be appended to the version number. For example, if the version is `1.0.0` and the pre-release is `alpha`, the version will be `1.0.0-alpha.1`. For "production" releases, the "latest" tag will be used for NPM.

This is typically set via the `branches` configuration (recommended), but can be overridden here.

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

The branches to use for the release along with their channel. If not provided, the default is:

```yaml
- {name: 'main'}
```

The above will release to the `latest` channel on NPM. If you want to release to a different channel, you can specify it like so:

```yaml
branches:
  - {name: 'main'}
  - {name: 'develop', channel: 'alpha'}
  - {name: 'staging', channel: 'beta'}
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
branches:
  - {name: main}
  - {name: next, channel: next}
  - {name: beta, channel: beta}
publish: true
run: echo 'Hello, World!'
```

# Types

You can find the types defined at [src/index.ts](src/index.ts).

# Support, Feedback, and Contributions

- Star this repo if you like it!
- Submit an [issue](https://github.com/mhweiner/jsout/issues) with your problem, feature request or bug report
- Issue a PR against `main` and request review. Make sure all tests pass and coverage is good.
- Write about `autorel` in your blog, tweet about it, or share it with your friends!

## Sponsors

<picture>
    <source srcset="docs/aeroview-logo-lockup.svg" media="(prefers-color-scheme: dark)">
    <source srcset="docs/aeroview-logo-lockup-dark.svg" media="(prefers-color-scheme: light)">
    <img src="docs/aeroview-logo-lockup-dark.svg" alt="Logo" style="max-width: 150px;margin: 0 0 10px">
</picture>

Aeroview is a developer-friendly, AI-powered observability platform that helps you monitor, troubleshoot, and optimize your applications. Get started for free at [https://aeroview.io](https://aeroview.io).
