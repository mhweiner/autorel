## Configuration Options

When run in CLI mode, `autorel` can be configured via CLI arguments or a `yaml` file. CLI arguments take precedence over the `yaml` file. All parameters are optional.

However, omitting optional binary flags, such as the `--publish`, `--dry-run`, `--skip-release`, and `--verbose` flags will still publish to NPM if set in the `yaml` file.

If you want to use `autorel` as a library, see [this](./usage-library.md).

> ❗️ The `yaml` configuration file must be named `.autorel.yaml` and be in the root of your project.

[See sample YAML configuration](/docs/usage.md#sample-yaml-configuration)

---
- [publish](#publish)
- [dryRun](#dryrun)
- [verbose](#verbose)
- [skipRelease](#skiprelease)
- [run](#run)
- [preRun](#prerun)
- [preRelease](#prerelease)
- [useVersion](#usever)
- [githubToken](#githubtoken)
- [breakingChangeTitle](#breakingchangetitle)
- [commitTypes](#committypes)
- [branches](#branches)
---

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

