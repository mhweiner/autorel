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
- It's not 100% compliant with Conventional Commits and SemVer out of the box, which can lead to incorrect versioning and release notes.
- It has way too many dependencies (500+ across common plugins), which can lead to security vulnerabilities, broken builds, and other issues.
- It doesn't do enough validation of configuration, which can lead to broken releases.

On the other hand, `autorel` is simple, fast, safe, and easy to use. It's written in TypeScript and has only 3 dependencies, with comprehensive test coverage.

Any automation tool comes with a risk/reward profile, and `autorel` is designed to minimize the risk while maximizing the reward.

For further reading, I wrote an article this: [Simplify Your Automated Releases with Autorel](https://medium.com/@mhweiner/introducing-autorel-simplifying-automated-releases-5ce5255e3a24)