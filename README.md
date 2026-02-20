# 🚀 autorel

![Build Status](https://github.com/mhweiner/autorel/actions/workflows/release.yml/badge.svg)
 [![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)]() [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) [![autorel](https://img.shields.io/badge/%F0%9F%9A%80%20autorel-2D4DDE)](https://github.com/mhweiner/autorel)

Autorel is a fast, simple, and reliable tool for automating releases based on commit messages. Similar to `semantic-release` or `release-please`, but faster, more reliable, and easier to use. Use autorel to save time, prevent broken releases, and ship with confidence.

```bash
npx autorel@^2 --pre-release alpha --publish --run 'echo "Next version is ${NEXT_VERSION}"'
```

It follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and [Semantic Versioning](https://semver.org/) to automatically:

- Run pre-release tasks (tests, builds, etc.)
- Bump the version and tag based on commit messages
- Create tagged releases with changelog notes
- Publish to package manager registry
- Run custom scripts or commands with the new version number available as an environment variable

Designed for GitHub Actions and npm, but you can use custom commands for other platforms (or contribute built-in support).

**✅ Conventional Commit & SemVer Compliant** 
- 100% compliant with Conventional Commits and SemVer out of the box, including "!" for breaking changes

**🔒 Safe & Reliable**
- Automatic rollback on failure
- No confusing configuration files or complex setup
- Configuration validation and error handling
- Excellent test coverage

**🚀 Fast & Lightweight**
- Minimal dependencies and fast, concurrent execution
- Written in TypeScript with comprehensive test coverage
- No need to install or configure a separate CI/CD system
- Less broken builds and more time to focus on your code!

## Table of Contents

- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Example Usage](#example-usage)
- [GitHub Actions Setup](#github-actions-setup)
- [Authentication & Permissions](#authentication--permissions)
- [Commit Messages](#commit-messages)
- [Using with Other Platforms](#using-with-other-platforms)
- [Using as a Library](#using-as-a-library)
- [Troubleshooting](#troubleshooting)
- [Configuration Options](/docs/configuration-options.md)
- [FAQ](docs/faq.md)
- [System Requirements](#system-requirements)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

The simplest way to get started is using `npx` (no installation required):

**First, test what would happen:**
```bash
npx autorel@^2 --dry-run --verbose
```

This shows you what version would be released and what changes would be made, without actually doing anything.

**When ready, run for real:**
```bash
npx autorel@^2 --publish
```

This will automatically:
1. Analyze commit messages since the last release
2. Bump the version based on Conventional Commits
3. Create a GitHub release with changelog notes
4. Publish to npm (if `--publish` is set)

> **Note:** When using `npx`, append the version number (e.g., `@^2`) to prevent breaking changes in future versions.

> ⚠️ **Before publishing:** Make sure you're authenticated with npm (see [Authentication & Permissions](#authentication--permissions)). If no commits require a release, autorel will exit successfully without making any changes.

## How It Works

### Order of Operations

When autorel runs, it follows this sequence:

1. **Analyze commits** - Scans git history since the last release tag
2. **Determine version** - Calculates the next version based on Conventional Commits
3. **Check if release needed** - If no commits require a release, exits successfully (no changes made)
4. **Run pre-release tasks** - Executes `preRun` scripts (tests, builds, etc.) if configured
5. **Create git tag** - Tags the current commit with the new version
6. **Create GitHub release** - Creates a release on GitHub with changelog (unless `--skip-release`)
7. **Update package.json** - Updates version temporarily in memory (not committed to repo)
8. **Publish to npm** - Publishes package if `--publish` is set
9. **Restore package.json** - Immediately restores package.json to original version (always happens, even if publish fails)
10. **Run post-release scripts** - Executes `run` scripts with `NEXT_VERSION` and `NEXT_TAG` environment variables

### When No Release is Needed

If your commits don't include any that trigger a release (e.g., only `docs:` or `style:` commits), autorel will:
- Exit successfully with code 0
- Print a message indicating no release is needed
- Make no changes to your repository, tags, or npm

This is expected behavior and not an error.

### First Release

If this is your first release (no previous tags exist), autorel will:
- Start from the beginning of your git history
- Use `0.0.0` as the base version
- **Increment based on your commit type:**
  - `fix:` → `0.0.1` (patch)
  - `feat:` → `0.1.0` (minor)
  - `feat!:` or breaking change → `1.0.0` (major)
- Create the first release tag

**Note:** The version in your `package.json` is not used for version calculation—only git tags are considered.

### Error Handling & Rollback

If any step fails, autorel will:
- Stop execution immediately
- **Rollback:** 
  - Remove any git tags that were created in this run
  - Delete any GitHub releases that were created
  - Attempt to unpublish from npm (if publish succeeded but later steps failed)
- **Package.json:** Always restored to original version immediately after npm publish (whether publish succeeds or fails)
- Exit with a non-zero code and display error details

Use `--dry-run` to test before running for real.

## Example Usage

### Basic Example

```bash
autorel --publish --run 'aws s3 sync dist/ s3://my-bucket/${NEXT_VERSION}/'
```

This will:
1. Bump the version based on the commit messages since the last release
2. Create a new release on GitHub with Release Notes
3. Update package.json and publish the release to npm (the version change is not committed to the repository—see [About package.json Versions](#about-packagejson-versions) below)
4. Copy the dist/ directory to an AWS S3 bucket with the new version number

### Configuration Options

You can configure autorel in two ways, and you can use both together:

**1. CLI Arguments** - Pass options directly via command-line flags

**2. YAML Configuration File** - Create a `.autorel.yaml` file in your project root

**Priority:** CLI arguments override YAML settings. You can set defaults in `.autorel.yaml` and override them with CLI flags when needed.

Create a `.autorel.yaml` file in your project root:

```yaml
# Define the branches and their respective channels
branches:
  - {name: 'main'}
  - {name: 'next', preRelease: 'next'}

# Enable publishing to npm
publish: true

# Run custom script after publish
run: |
  echo "$(date +"%Y-%m-%d") ${NEXT_VERSION}" >> versions.txt
  aws s3 sync dist/ s3://my-bucket/${NEXT_VERSION}/
```

> **Note:** The YAML file must be named `.autorel.yaml` and placed in the root of your project. CLI arguments override YAML settings. See [Configuration Options](/docs/configuration-options.md) for all available settings.

### More Examples

Release a specific version regardless of commit messages:
```bash
autorel --use-version 2.0.0 --publish
```

Run tests and build before releasing, then deploy to S3 after:
```bash
autorel --pre-run 'npm test && npm run build' --publish --run 'aws s3 sync dist/ s3://my-bucket/${NEXT_VERSION}/'
```

Skip GitHub release but publish to npm and build Docker image:
```bash
autorel --publish --skip-release --run 'docker build -t myapp:${NEXT_VERSION} .'
```

Enable verbose logging to debug release issues:
```bash
autorel --verbose --publish --run 'echo "Published ${NEXT_VERSION}"'
```

## GitHub Actions Setup

Autorel works seamlessly with GitHub Actions. Here's a complete workflow example:

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

> ❗️ **Required:** You must set `fetch-depth: 0` and `fetch-tags: true` in `actions/checkout@v4` (or later) or autorel will not work correctly. This ensures autorel can analyze the full git history.

> ❗️ **For npm publishing:** You must be authenticated with npm. See the [npm authentication guide](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry) for setup instructions.

### Using `--run` with the version in GitHub Actions

**Only if you put `NEXT_VERSION` or `NEXT_TAG` in your `--run` command** (e.g. as an argument to your script), use a double dollar so the version is passed through. For example:

```yaml
- run: npx autorel@^2 --publish --run "deploy-service $$NEXT_VERSION"
```

In Actions the step `run:` is expanded by the runner *before* autorel runs, so a single `$` would be expanded when the variable is still unset. `$$` becomes a literal `$`, so the shell that runs your script gets `$NEXT_VERSION` after autorel has set it.

If you don't reference the version in the command—your script reads `process.env.NEXT_VERSION` or `$NEXT_VERSION`, or the command is in `.autorel.yaml`—you don't need `$$`. `NEXT_TAG` is also available (e.g. for Docker tags that use `v`).

## Authentication & Permissions

### GitHub Token
Autorel sets `NEXT_VERSION` and `NEXT_TAG` in the environment right before it runs your `--run` script. In Actions, the step `run:` is expanded by the runner *before* autorel runs, so `${NEXT_VERSION}` is expanded when it’s still unset
To create releases on GitHub, autorel needs a GitHub token:

- **GitHub Actions:** The `GITHUB_TOKEN` is automatically provided (no setup needed)
- **Local/Other CI:** Set the `GITHUB_TOKEN` environment variable or use `--github-token` flag
- **Required scope:** `repo` (to create releases)

### npm Token

To publish packages to npm, you need authentication:

- **Local usage:** Run `npm login`
- **CI/CD:** Set the `NODE_AUTH_TOKEN` environment variable to your npm token
- **GitHub Actions:** See the [npm publishing guide](https://docs.github.com/en/actions/guides/publishing-nodejs-packages#publishing-packages-to-the-npm-registry)
- **Required scope:** `publish` (at minimum)

### About package.json Versions

When using npm publishing, autorel:
1. Temporarily updates `package.json` version in memory
2. Publishes to npm with that version
3. **Immediately restores** `package.json` to the original version (even if publish fails)
4. Then runs post-release scripts (`--run`)

**Important:** Package.json is restored **before** post-release scripts run. If your post-release script needs the new version in package.json (e.g., for Docker builds), you have two options:

**Option 1: Use environment variables** (recommended)
```bash
autorel --publish --run 'docker build -t myapp:${NEXT_VERSION} .'
```

**Option 2: Update package.json in your script**
```bash
autorel --publish --run 'npm version ${NEXT_VERSION} --no-git-tag-version && docker build -t myapp:${NEXT_VERSION} .'
```

**Why this approach?**
- The version in `package.json` is only needed for npm publishing
- Committing version changes can cause merge conflicts and create unnecessary noise in your repository
- The git tag is the source of truth for your version
- Package.json is automatically restored, so there's nothing to rollback

The `NEXT_VERSION` and `NEXT_TAG` environment variables are always available in your `--run` scripts.

## Commit Messages

Autorel automatically determines version bumps and generates changelogs by parsing your commit messages. Your commits must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

### Version Bump Examples

Here are examples of commit messages and the resulting version bump (using default configuration):

- `fix: fix a bug` → `0.0.1` (patch)
- `feat: add new feature` → `0.1.0` (minor)
- `feat!: add breaking change` → `1.0.0` (major)

### Commit Type Mapping

By default, the following commit types trigger releases:
- `feat`: minor version bump
- `fix`, `perf`, `revert`: patch version bump
- Any commit with `!` after the type (e.g., `feat!:`) or `BREAKING CHANGE:`/`BREAKING CHANGES:` in the footer: major version bump

Other commit types (like `docs`, `style`, `refactor`, `test`, `build`, `ci`) don't trigger releases but are included in changelogs.

See the [default configuration](/src/defaults.ts) for the complete mapping, or customize it in your `.autorel.yaml` file. Learn more about [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Using with Other Platforms

### Other Repositories (not GitHub)

Autorel is designed to work with any CI/CD system, not just GitHub Actions. You can use it with GitLab, Bitbucket, Jenkins, or any other system that supports running shell commands and meets our [system requirements](#system-requirements).

Simply use the `--skip-release` flag (or `skipRelease: true` in YAML) to skip creating a release on GitHub. Then, use the `--run` flag (or `run: string` in YAML) to run any command or script after the version bump with the new version number available as an environment variable (`NEXT_VERSION` or `NEXT_TAG`).

Example:
```bash
autorel --skip-release --run 'echo "Version ${NEXT_VERSION} released"'
```

If you're interested in contributing built-in support for other systems, please open an issue or PR.

### Other Languages (not Node.js)

Autorel is designed to work with any language or platform. You can use it with Python, Ruby, Go, Java, or any other language.

Simply omit the `--publish` flag (or set `publish: false` in YAML, which is the default) to skip publishing to npm. Then, use the `--run` flag (or `run: string` in YAML) to run any command or script after the version bump.

Example:
```bash
# Docker build using the version from environment variable
autorel --run 'docker build -t myapp:${NEXT_VERSION} . && docker push myapp:${NEXT_VERSION}'
```

**Note:** If you're using `--publish`, package.json is restored to the original version before `--run` scripts execute. Use the `NEXT_VERSION` environment variable (as shown above) rather than reading from package.json.

If you're interested in contributing built-in support for other package managers, please open an issue or PR.

## Using as a Library

You can use autorel programmatically in your Node.js projects.

### Installation

```bash
npm i autorel
```

### Example Usage

```typescript
import {autorel, defaultConfig} from 'autorel';

const autorelConfig = {
  ...defaultConfig,
  publish: true,
};

autorel(autorelConfig).then((nextVersion) => {
    console.log(`Next version is ${nextVersion}`); // e.g., "Next version is 1.0.1"
});
```

### Configuration

When used as a library, you pass the configuration directly to the `autorel` function. It will not automatically load any default configuration—you can use the `defaultConfig` object to get the default configuration:

```typescript
import {autorel, defaultConfig} from 'autorel';

autorel(defaultConfig).then((nextVersion) => {
    console.log(`Next version is ${nextVersion}`);
});
```

### Types

TypeScript types are available. You can find the type definitions at [src/index.ts](src/index.ts) or import them directly:

```typescript
import type {Config, CommitType} from 'autorel';
```

### Environment Variables in Scripts

The `NEXT_VERSION` and `NEXT_TAG` environment variables are available in:
- ✅ `run` scripts (after release is complete)
- ❌ `preRun` scripts (version not yet determined)

**Note:** Package.json is restored to the original version before `run` scripts execute. If you need the new version in package.json for your script, use the environment variables or update package.json manually in your script.

Example:
```bash
# Using environment variable (package.json will have old version)
autorel --run 'echo "Published ${NEXT_VERSION}" && docker build -t myapp:${NEXT_VERSION} .'

# If you need package.json to have the new version:
autorel --run 'npm version ${NEXT_VERSION} --no-git-tag-version && docker build -t myapp:${NEXT_VERSION} .'
```

## Troubleshooting

### "No commits found" or "No release needed"

This means autorel analyzed your commits and determined none of them require a release. This is **not an error**—autorel exits successfully.

**Common causes:**
- Only documentation, style, or refactor commits since last release
- No commits since last release
- All commits are marked as `release: 'none'` in your configuration

**Solution:** Make commits that trigger releases (e.g., `feat:`, `fix:`, or commits with `!` for breaking changes).

### Authentication Failed

**npm authentication:**
```bash
# Test locally
npm whoami
# If not logged in:
npm login
# Or set token:
export NODE_AUTH_TOKEN=your_token_here
```

**GitHub authentication:**
```bash
# Test token
export GITHUB_TOKEN=your_token_here
# Verify it works
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

**GitHub Actions:** Make sure `GITHUB_TOKEN` and `NODE_AUTH_TOKEN` are set in your workflow's `env` section.

### Tag Already Exists

If you see "tag already exists" error:
- The tag was created but the release failed partway through
- You may have manually created a tag with the same version

**Solution:**
- Delete the tag: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`
- Or use a different version: `autorel --use-version 1.0.1`

### Release Created But npm Publish Failed

If the GitHub release was created but npm publish failed:
- The release cannot be automatically rolled back
- You can manually delete the GitHub release if needed
- Fix the npm issue and re-run (use `--use-version` to avoid creating a new release)

### Pre-run Scripts Not Executing

`preRun` scripts only run if:
- A release is needed (commits require a release)
- Not in dry-run mode

If your `preRun` isn't running, check:
1. Do you have commits that trigger a release?
2. Are you using `--dry-run`? (preRun doesn't run in dry-run)
3. Check the logs with `--verbose`

### Wrong Version Calculated

If autorel calculated the wrong version:
- Check your commit messages follow Conventional Commits
- Verify your `commitTypes` configuration (if customized)
- Use `--dry-run --verbose` to see which commits were analyzed
- Check the [default configuration](/src/defaults.ts) to understand version bump logic

### Testing Locally

Always test before running in CI:

```bash
# See what would happen
npx autorel@^2 --dry-run --verbose

# Test with a specific version
npx autorel@^2 --dry-run --use-version 1.0.0 --verbose

# Test authentication
npm whoami  # for npm
export GITHUB_TOKEN=your_token && npx autorel@^2 --dry-run  # for GitHub
```

## System Requirements

- Linux or MacOS (Windows is not officially supported)
- Node.js 14+
- npm 7+
- Git 2.13+
- Bash

## Contributing

- ⭐ Star this repo if you like it!
- 🐛 Open an [issue](https://github.com/mhweiner/autorel/issues) for bugs or suggestions.
- 🤝 Submit a PR to `main` — all tests must pass.

## Related Projects

- [brek](https://github.com/mhweiner/brek): powerful yet simple configuration library for Node.js. It’s structured, typed, and designed for dynamic configuration loading, making it perfect for securely managing secrets (e.g., AWS Secrets Manager).
- [kizu](https://github.com/mhweiner/kizu): An easy-to-use, fast, and defensive JS/TS test runner designed to help you to write simple, readable, and maintainable tests.
- [cjs-mock](https://github.com/mhweiner/cjs-mock): NodeJS module mocking for CJS (CommonJS) modules for unit testing purposes.
- [jsout](https://github.com/mhweiner/jsout): A Syslog-compatible, simple, and DevOps-friendly logger for Typescript/Javascript projects. Works great with aggregators like [Aeroview](https://aeroview.io) and [CloudWatch](https://aws.amazon.com/cloudwatch/).

## License

[MIT](LICENSE)
