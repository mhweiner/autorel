# FAQ

### Why should I use a tool like `autorel`?

By automating your releases, you can save time and reduce human error. The release process is brittle with many steps that are easy to mess up, often with big consequences. 

`autorel` follows best practices for versioning and release notes, so you don't have to worry about it. Proper versioning (following SemVer) is important for communicating changes to your users and maintaining compatibility.

`autorel` is designed to be simple and easy to use, with minimal configuration required. It's also fast and lightweight, so you can focus on your code, not your release process.

### How does `autorel` compare to `semantic-release`?

`semantic-release` was the inspiration for this project, after using it for the past 7+ years. I have much respect and appreciation for the authors and contributors of `semantic-release`.

However, it has some major issues.

The tl;dr is:

- Semantic Release is complex, slow, and frustrating to configure.
- It has a steep learning curve and requires a lot of setup.
- It's not 100% compliant with Conventional Commits and SemVer out of the box, which can lead to incorrect versioning and releases.
- It has way too many dependencies (500+ across common plugins), which leads to slow installs, large node_modules, and potential security vulnerabilities. Also leads to broken builds when dependencies are updated.
- It doesn't do enough validation of configuration, which can lead to broken/failed releases.

On the other hand, `autorel` is simple, fast, safe, and easy to use. It's written in TypeScript and has only 3 dependencies, with comprehensive test coverage.

Any automation tool comes with a risk/reward profile, and `autorel` is designed to minimize the risk while maximizing the reward.

For further reading, I wrote an article about this: [Simplify Your Automated Releases with Autorel](https://medium.com/@mhweiner/introducing-autorel-simplifying-automated-releases-5ce5255e3a24)

### What if I want to skip a release?

If you want to skip a release for specific commits, you have a few options:

1. **Don't commit changes that trigger releases** - Use commit types like `docs:`, `style:`, `refactor:` that don't trigger releases by default
2. **Use `--dry-run`** - Test what would happen without actually releasing
3. **Don't run autorel** - Simply don't trigger the release process

If autorel determines no release is needed, it exits successfully without making any changes.

### Can I customize the changelog format?

Currently, autorel uses a standard changelog format based on Conventional Commits. The changelog groups commits by type (Features, Bug Fixes, etc.) and includes breaking changes in a separate section.

Custom changelog formatting is not currently supported, but you can:
- Customize the breaking changes title via `breakingChangeTitle` in your config
- Customize which commit types appear via `commitTypes` configuration
- Use the `--run` flag to generate a custom changelog after release using the `NEXT_VERSION` environment variable

If you need custom changelog formatting, please open an issue or PR.

### How do I release a specific version?

Use the `--use-version` flag (or `useVersion` in YAML) to force a specific version:

```bash
autorel --use-version 2.0.0 --publish
```

This will:
- Always create a release (unless `noRelease` is true)
- Override version calculation from commits
- Override `--pre-release` and branch configuration

**Note:** This is advanced usage. The recommended approach is to let autorel calculate versions from your commit messages.

### What's the difference between `--pre-release` and `prereleaseChannel` in branches config?

- **`--pre-release` (CLI flag)**: Overrides branch configuration and forces a pre-release channel for this run
- **`prereleaseChannel` (in branches config)**: Automatically uses the pre-release channel based on which branch you're on

**Example:**

```yaml
branches:
  - {name: 'main'}  # Production releases
  - {name: 'develop', prereleaseChannel: 'alpha'}  # Alpha pre-releases
```

When you run autorel on `develop`, it automatically uses the `alpha` channel. When you run it on `main`, it creates a production release.

Using `--pre-release beta` overrides this and forces a `beta` pre-release regardless of branch.

### What happens if package.json doesn't exist?

If you're not using npm publishing (`--publish`), autorel works fine without `package.json`. It will:
- Still analyze commits and determine version
- Still create git tags
- Still create GitHub releases
- Skip the package.json update step

If you are using `--publish`, you need a `package.json` with a valid `name` and `version` field.

### Can I use autorel with monorepos?

Yes! Autorel works with monorepos. You can:

1. **Run from root** - Analyze all commits and create a single release for the entire repo
2. **Run from subdirectory** - Use `--run` to handle monorepo-specific logic:

```bash
autorel --run 'npm run release:monorepo ${NEXT_VERSION}'
```

For more complex monorepo setups, you might want to use autorel as a library to build custom tooling.

### How do I handle hotfixes or patch releases for old versions?

Autorel always releases from the current branch/commit. To create a hotfix:

1. Checkout the version branch you want to patch (e.g., `git checkout 1.0.x`)
2. Make your fix commit with a `fix:` message
3. Run autorel - it will create a patch release (e.g., `1.0.1`)
4. Merge the fix back to main

Autorel will automatically determine it's a patch based on the commit message.

### What if my commits don't follow Conventional Commits?

If your commits don't follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- Autorel won't be able to determine the version bump
- It will exit with "no release needed" (not an error)
- You'll need to either:
  - Rewrite commit messages (using `git rebase -i`)
  - Use `--use-version` to force a specific version
  - Start following Conventional Commits going forward

### Can I customize which commit types trigger releases?

Yes! You can customize `commitTypes` in your `.autorel.yaml`:

```yaml
commitTypes:
  - {type: 'feat', title: '✨ Features', release: 'minor'}
  - {type: 'fix', title: '🐛 Bug Fixes', release: 'patch'}
  - {type: 'custom', title: 'Custom Changes', release: 'major'}  # Your custom type
```

See the [default configuration](/src/defaults.ts) for the complete list and [Configuration Options](../docs/configuration-options.md) for details.