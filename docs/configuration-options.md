## Configuration Options

This document provides a complete reference for all autorel configuration options.

### Configuration Methods

Autorel can be configured in three ways:

1. **CLI Arguments** - Pass options directly via command-line flags
2. **YAML File** - Create a `.autorel.yaml` file in your project root (recommended for CI/CD)
3. **Library API** - Pass configuration when using autorel as a library

**Priority:** CLI arguments take precedence over YAML file settings. All parameters are optional.

> ❗️ **Important:** The YAML configuration file must be named `.autorel.yaml` and be placed in the root of your project.

> **Note:** CLI arguments override YAML settings. For boolean flags like `--publish`, passing the flag sets it to `true` and overrides YAML. Omitting the flag uses the YAML value (or defaults to `false`).

### Quick Links

- [Sample YAML configuration](../README.md#example-usage) - See the Configuration Options section
- [Using autorel as a library](../README.md#using-as-a-library)

---
- [publish](#publish)
- [dryRun](#dryrun)
- [verbose](#verbose)
- [skipRelease](#skiprelease)
- [run](#run)
- [preRun](#prerun)
- [preRelease](#prerelease)
- [useVersion](#useversion)
- [githubToken](#githubtoken)
- [breakingChangeTitle](#breakingchangetitle)
- [commitTypes](#committypes)
- [branches](#branches)
---

### publish

Whether to publish the release to npm. If `true`, you must be authenticated with npm. To do so via GitHub Actions, see [this](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry).

- CLI: `--publish`
- Argument: `publish: boolean`
- Default: `false`

### dryRun

Whether to run in dry-run mode. This will not push the tag, create the release, publish to npm, or run the command.

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

- CLI: `--run <command>`
- Argument: `run: string`
- Default: `undefined`

### preRun

A `bash` command/script to run before the release is started. All scripts are run in "-e" mode, meaning they will exit on the first error. Here's where you can do things like run tests or do build steps.

This could save you time and money by not running unnecessary steps in your CI/CD pipeline. It will not run if no release is determined to be necessary, and it will not run in dry-run mode.

This is run *after* determining the new version number but *before* pushing tags, creating the release on GitHub, updating the package.json, or publishing to npm. 

Example CLI usage:

```bash
autorel --pre-run 'npm test && npm run build'
```

Example YAML usage: 

```yaml
preRun: |
  npm ci
  npm run build
  npm run test
  npm run lint
```

- CLI: `--pre-run <command>`
- Argument: `preRun: string`
- Default: `undefined`

### preRelease

> ❗️ This is typically set via the `branches` configuration (recommended), but can be overridden here.

The pre-release channel to use. This will be appended to the version number. For example, if the version is `1.0.0` and the pre-release is `alpha`, the version will be `1.0.0-alpha.1`. For "production" releases, the "latest" tag will be used for npm.

- CLI: `--pre-release <channel>`
- Example: `--pre-release alpha`
- Argument: `preRelease: string`
- Default: `undefined`

### useVersion

The version to use for the release INSTEAD of the version being generated. Always results in a release being created unless `noRelease` is `true`. **Advanced usage only, not recommended for most users.**

- CLI: `--use-version <version>`
- Example: `--use-version 2.0.0`
- Argument: `useVersion: string`
- Default: `undefined`

> ❗️ Must be a valid SemVer version, without the `v`.

### githubToken

The GitHub token to use for creating releases on GitHub. 

- If not provided, autorel will use the `GITHUB_TOKEN` environment variable
- This is only used if `skipRelease` is `false`
- The token needs the `repo` scope to create releases

**For GitHub Actions:** The `GITHUB_TOKEN` is automatically provided by GitHub Actions, so you typically don't need to set this.

- CLI: `--github-token <token>`
- Example: `--github-token ghp_xxxxxxxxxxxx`
- Argument: `githubToken: string`
- Default: `process.env.GITHUB_TOKEN`


### breakingChangeTitle (YAML/library only)

The title to use for the breaking changes section in the release notes.

- Argument: `breakingChangeTitle: string`
- Default: `"🚨 Breaking Changes 🚨"`

### commitTypes (YAML/library only)

The commit types to use for both the release notes and version bumping.

For example, in the [default configuration](/src/defaults.ts), the following commits would result in:

- `feat`: `minor`
- `fix`: `patch`
- `perf`: `patch`
- `revert`: `patch`

And all other commit types will result in no release.

- Argument: `commitTypes: CommitType[]`
- Defaults: [/src/defaults.ts](/src/defaults.ts)

### branches (YAML/library only)

The branches to use for the release along with their pre-release channel. If not provided, the default is:

```yaml
- {name: 'main'}
```

The above will release to the `latest` channel on npm. If you want to release to a different channel (making it a pre-release), you can specify it like so:

```yaml
branches:
  - {name: 'main'}
  - {name: 'develop', prereleaseChannel: 'alpha'}
  - {name: 'staging', prereleaseChannel: 'beta'}
```

The above will release to the `latest` channel (production) on npm for the `main` branch, the `alpha` pre-release channel for the `develop` branch, and the `beta` pre-release channel for the `staging` branch.

- Argument: `branches: ReleaseBranch[]`

