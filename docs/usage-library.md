# Using `autorel` as a library

## Example Usage

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

## Configuration

When used as a library, you pass the configuration directly to the `autorel` function. When used this way, it will not automatically load any default configuration&mdash;you can use the `defaultConfig` object to get the default configuration:

```typescript
import {autorel, defaultConfig} from 'autorel';

autorel(defaultConfig).then((nextVersion) => {
    console.log(`Next version is ${nextVersion}`); // ie, "Next version is 1.0.1"
});
```
