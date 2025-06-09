<picture>
    <source srcset="docs/autorel-logo-light.svg" media="(prefers-color-scheme: light)">
    <source srcset="docs/autorel-logo-dark.svg" media="(prefers-color-scheme: dark)">
    <img src="docs/autorel-logo-light.svg" alt="Logo">
</picture> 

[![build status](https://github.com/mhweiner/autorel/actions/workflows/release.yml/badge.svg)](https://github.com/mhweiner/autorel/actions)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)]()
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![AutoRel](https://img.shields.io/badge/AutoRel-1bd499)](https://github.com/mhweiner/autorel)

🚀 **Autorel** is a fast, simple, and reliable tool for automating releases based on commit messages.

It follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and [Semantic Versioning](https://semver.org/) to do things like:

- Run pre-release tasks (tests, builds, etc.)
- Bump the version and tag based on commit messages
- Create tagged GitHub releases with changelog notes
- Publish to npm registry (or other package managers)
- Run custom scripts or commands with the new version number available as an environment variable

Like `semantic-release` or `release-please`, but faster, more reliable, and easier to use.

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
- [Usage](/docs/usage.md)
- [Commit Messages](#commit-messages)
- [FAQ](docs/faq.md)
- [System Requirements](#system-requirements)
- [Contributing](#contributing)
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

However, we recommend you simply call `npx autorel@^2` in your CI/CD pipeline (or locally) and set your configuration in the `.autorel.yaml` file like so:

```yaml
# .autorel.yaml
publish: true
run: |
  echo "Next version is ${NEXT_VERSION}"
```

> ⚠️ If using the `npx` command, you may want to append the version number to prevent breaking changes in the future. You can do this by appending `@^` followed by the major version number, ie. `npx autorel@^2`.

## Usage and Configuration

See [Usage](/docs/usage.md) and [Configuration Options](/docs/configuration-options.md) for more information.

## Commit Messages

Commit messages are parsed to automatically determine the version bump and generate the changelog.

They must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard specification.

Here are some examples of commit messages and the resulting version bump (with the default configuration):

- `fix: fix a bug` -> `0.0.1` (patch)
- `feat: add new feature` -> `0.1.0` (minor)
- `feat!: add breaking change` -> `1.0.0` (major)

See our [default configuration](/src/defaults.ts) for more details on how commit types are mapped to version bumps and the changelog.

You can find more examples in the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) documentation.

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

## Other useful libraries

- [brek](https://github.com/mhweiner/brek): powerful yet simple configuration library for Node.js. It’s structured, typed, and designed for dynamic configuration loading, making it perfect for securely managing secrets (e.g., AWS Secrets Manager).
- [hoare](https://github.com/mhweiner/hoare): An easy-to-use, fast, and defensive JS/TS test runner designed to help you to write simple, readable, and maintainable tests.
- [jsout](https://github.com/mhweiner/jsout): A Syslog-compatible, small, and simple logger for Typescript/Javascript projects.
- [cjs-mock](https://github.com/mhweiner/cjs-mock): NodeJS module mocking for CJS (CommonJS) modules for unit testing purposes.

## License

[MIT](LICENSE)
