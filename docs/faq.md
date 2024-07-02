# FAQ

### Why should I use a tool like `autorel`?

By automating your releases, you can save time and reduce human error. The release process is brittle with many steps that are easy to mess up, often with big consequences. 

`autorel` follows best practices for versioning and release notes, so you don't have to worry about it. Proper versioning (following SemVer) is important for communicating changes to your users and maintaining compatibility.

`autorel` is designed to be simple and easy to use, with minimal configuration required. It's also fast and lightweight, so you can focus on your code, not your release process.

### How does `autorel` compare to `semantic-release`?

`semantic-release` was the inspiration for this project, after using it for the past 7+ years. I have much respect and appreciation for the authors and contributors of `semantic-release`.

However, it has not aged well. I would often find myself frustrated with its complexity, slow execution, and frustrating configuration. I've wasted many hours debugging broken builds and trying to get it to work the way I wanted.

It has a very steep learning curve and requires a lot of setup with very confusing and spread out documentation across several repositories.

It's also not 100% compliant with Conventional Commits and SemVer out of the box, which can lead to incorrect versioning and release notes.

`semantic-release`, together with its required plugins, is a massive and somewhat outdated codebase (written in ES5 Javascript) and has many dependencies (which themselves have many dependencies), which can lead to security vulnerabilities, broken builds, and other issues.

`autorel` is a fresh take on the concept, with a focus on simplicity, speed, and compliance with Conventional Commits and SemVer. It's written in TypeScript and has minimal dependencies, with comprehensive test coverage.