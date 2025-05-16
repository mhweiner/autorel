# autorel

[![build status](https://github.com/mhweiner/autorel/actions/workflows/release.yml/badge.svg)](https://github.com/mhweiner/autorel/actions)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)]()
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![AutoRel](https://img.shields.io/badge/AutoRel-1bd499)](https://github.com/mhweiner/autorel)

**Autorel** is a fast, simple, and reliable tool for automating releases based on commit messages.

It follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and [Semantic Versioning](https://semver.org/) to do things like:

- Run pre-release tasks (tests, builds, etc.)
- Bump the version and tag based on commit messages
- Create tagged GitHub releases with notes
- Publish to npm
- Run custom scripts

🚀 Like `semantic-release` or `release-please`, but faster, more reliable, and easier to use.

Supports GitHub Actions and npm (Node.js) natively. You can add custom scripts for other languages and systems (or contribute built-in support).

Use Autorel to save time, prevent broken releases, and ship with confidence.

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

[Read our FAQ on why you should use `autorel` and how it compares to other tools](docs/faq.md)

## Table of Contents

- [Example Usage (CLI)](#example-usage-cli)
- [Example Usage (Library)](docs/usage-library.md)
- [System Requirements](#system-requirements)
- [Commit Messages](#commit-messages)
- [Usage with GitHub Actions](#usage-with-github-actions)
- [Usage with Other Repositories (not GitHub)](#usage-with-other-repositories-not-github)
- [Usage with Other Languages (not Node.js)](#usage-with-other-languages-not-nodejs)
- [Configuration](docs/configuration.md)
- [Sample YAML Configuration](docs/configuration.md#sample-yaml-configuration)
- [Types](#types)
- [Debug Mode](#debug-mode)
- [About package.json versions](#about-packagejson-versions)
- [FAQ](docs/faq.md)
- [Support, Feedback, and Contributions](#support-feedback-and-contributions)
- [License](#license)

## Example Usage (CLI)

```bash
npx autorel@^2 --publish --run 'echo "Next version is ${NEXT_VERSION}"'
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

### ⚠️ Avoiding Breaking Changes

If using the `npx` command, you may want to append the version number to prevent breaking changes in the future. You can do this by appending `@^` followed by the major version number, ie. `npx autorel@^2`.

## Example Usage (Library)

1. Install `autorel` as a dependency

    ```bash
    npm i autorel
    ```

2. Import and use in your project to build custom release tooling

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

## System Requirements

- Linux or MacOS (Windows is not officially supported)
- Node.js 14+
- NPM 7+
- Git 2.13+
- Bash

## Commit Messages

Commit messages are parsed to determine the version bump. They must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard specification.

Here are some examples of commit messages and the resulting [SemVer](https://semver.org) version bump (with the default configuration):

- `fix: fix a bug` -> `0.0.1` (patch)
- `feat: add new feature` -> `0.1.0` (minor)
- `feat!: add breaking change` -> `1.0.0` (major)

You can find more examples in the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) documentation.

## Usage with GitHub Actions

Autorel 💜 GitHub Actions. See [Using `autorel` with GitHub Actions](/docs/github-actions.md)

## Configuration

See [Configuration](docs/configuration.md) for reference and examples.

## Types

You can find the types defined at [src/index.ts](src/index.ts).

## Verbose Mode (Debug Mode)

To enable verbose mode, set `--verbose (verbose: true)` or environment variable `AUTOREL_DEBUG=1`:

```bash
npx autorel --verbose
```

## About package.json versions

If using our npm publishing feature, the package.json file's version will be updated in memory before being pushed to npm, as this is the only place where it's actually required. The change will not be pushed to the repository, as it is not necessary and could cause conflicts. See [this post](https://semantic-release.gitbook.io/semantic-release/support/faq)

If you need access to the new version number in your CI/CD pipeline, you can use the `NEXT_VERSION` or `NEXT_TAG` environment variables.

## Usage with Other Repositories (not GitHub)

`autorel` is designed to work with any CI/CD system, not just GitHub Actions. You can use it with GitLab, Bitbucket, Jenkins, or any other system that supports running shell commands.

Simply use the `--skip-release` flag (arg: `skipRelease: true`) to skip creating a release on GitHub. Then, you can use the `--run` flag (arg: `run: string`) to run any command or script after the version bump with the new version number available as an environment variable [see below](#run).

If you're interested in contributing built-in support for other systems, please open an issue or PR.

## Usage with Other Languages (not Node.js)

`autorel` is designed to work with any language or platform. You can use it with Python, Ruby, Go, Java, or any other language.

Simply omit the `--publish` flag (arg: `publish: false`, which is default) to skip publishing to NPM. Then, you can use either the `--run` flag (arg: `run: string`) or `runScript: string` arg to run any command or script after the version bump with the new version number available as an environment variable [see below](#run).

If you're interested in contributing built-in support for other systems, please open an issue or PR.

## Contributing

- ⭐ Star this repo if you like it!
- 🐛 Open an [issue](https://github.com/mhweiner/autorel/issues) for bugs or suggestions.
- 🤝 Submit a PR to `main` — all tests must pass.

## Other useful libraries

- [brek](https://github.com/mhweiner/brek): powerful yet simple configuration library for Node.js. It’s structured, typed, and designed for dynamic configuration loading, making it perfect for securely managing secrets (e.g., AWS Secrets Manager).
- [hoare](https://github.com/mhweiner/hoare): An easy-to-use, fast, and defensive JS/TS test runner designed to help you to write simple, readable, and maintainable tests.
- [jsout](https://github.com/mhweiner/jsout): A Syslog-compatible, small, and simple logger for Typescript/Javascript projects.
- [cjs-mock](https://github.com/mhweiner/cjs-mock): NodeJS module mocking for CJS (CommonJS) modules for unit testing purposes.

## License

[MIT](LICENSE)
