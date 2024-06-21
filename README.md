<picture>
    <source srcset="docs/jsout.svg" media="(prefers-color-scheme: dark)">
    <source srcset="docs/jsout-dark.svg" media="(prefers-color-scheme: light)">
    <img src="docs/jsout-dark.svg" alt="Logo" style="margin: 0 0 10px" size="250">
</picture>

---

[![build status](https://github.com/mhweiner/jsout/actions/workflows/release.yml/badge.svg)](https://github.com/mhweiner/jsout/actions)
[![semantic-release](https://img.shields.io/badge/semantic--release-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)]()

A DevOps friendly, small, and simple logger for Typescript/Javascript projects. Sponsored by [Aeroview](https://aeroview.io).

**Structured Logs 🔒**
- Supports both human-readable CLI output and JSON output for log aggregation into services like sumologic, New Relic, DataDog, etc.

**Defensive & Devops Friendly 🛡**
- Logs are enabled in production mode by default
- Transport should be handled outside of the process via `STDOUT` and `STDERR`
- Configuration should also be handled outside of the code
- Simple configurations make it hard to mess up
- Minimal dependencies

**Simple & Easy to Use 😃**
- Automatic Error serialization
- Out-of-the-box Typescript support
- Nice human readable output

**Flexible & Powerful 💪**
- Easily set configuration using simple CLI overrides
- Simple and well-defined enough to build custom tooling around, such as custom error handling and logging pipelines.

## Installation

```bash
npm i jsout
```
 
## Example Usage

```typescript
import {logger} from 'jsout';

logger.info('test message');
logger.fatal('oops!', new Error(), {foo: 'bar'})
logger.error('', new Error('test')); //infers "test" as message
```

## Express.js HTTP Request Logger

See [jsout-express](https://github.com/mhweiner/jsout-express)

## Configuration

Configuration is set through the CLI environment variables. By default, the logger is set to `info` level, `json` format, and `verbose` verbosity, which is recommended for production.

You can override these settings by setting the following environment variables before running your application.

For example, here is the recommended way to run your application locally:

```bash
LOG=debug LOG_FORMAT=human LOG_VERBOSITY=terse node /path/to/yourApp.js
```

### `process.env.LOG`

Sets the log level. Any logs lower than this log level are ignored.

**Possible values**: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`, `"fatal"`

**Default**: `"info"` (recommended for production)

### `process.env.LOG_FORMAT`

Set the format for the output to either be human-readable (great for local development in the console), or JSON formatted (great for data aggregation on a server).

**Possible values**: `"human"`, `"json"`

**Default**: `"json"` (recommended for production)

### `process.env.LOG_VERBOSITY`

If verbose, extra metadata is appended to `log.context`. Example:

```json
{
  "date": "2021-12-19T06:17:38.147Z",
  "pid": 71971,
  "ppid": 71970,
  "nodeVersion": "v16.13.0"
}
```

**Possible values**: `"terse"`, `"verbose"`

**Default**: `"verbose"` (recommended for production)

## API

For all of the following, please note:

- `error` should be an actual `Error` object with stack traces. This is not enforced.
- `context` should by any information not necessarily directly related to the error, ie. server request information, app component, configurations, etc. This is where the [verbose metadata](#processenvlog_verbosity) is appended (this will override anything in the context object).
- `data` any object that might be useful to debug the error, or any pertinant information relating to the log message

### `logger.trace(message?: string, data?: any, context?: any)`

Emits a log to `stdout` with a level of `TRACE (10)`

### `logger.debug(message?: string, data?: any, context?: any)`

Emits a log to `stdout` with a level of `DEBUG (20)`

### `logger.info(message?: string, data?: any, context?: any)`

Emits a log to `stdout` with a level of `INFO (30)`

### `logger.warn(message?: string, error?: any, data?: any, context?: any)`

Emits a log to `stderr` with a level of `WARN (40)`

### `logger.error(message?: string, error?: any, data?: any, context?: any)`

Emits a log to `stderr` with a level of `ERROR (50)`

### `logger.fatal(message?: string, error?: any, data?: any, context?: any)`

Emits a log to `stderr` with a level of `FATAL (60)`

## Contribution

Please contribute to this project! Issue a PR against `main` and request review. 

- Please test your work thoroughly.
- Make sure all tests pass with appropriate coverage.

### How to build locally

```bash
npm i
```

### Running tests

```shell script
npm test
```

## Get better observability with Aeroview

<picture>
    <source srcset="docs/aeroview-logo-lockup.svg" media="(prefers-color-scheme: dark)">
    <source srcset="docs/aeroview-logo-lockup-dark.svg" media="(prefers-color-scheme: light)">
    <img src="docs/aeroview-logo-lockup-dark.svg" alt="Logo" style="max-width: 150px;margin: 0 0 10px">
</picture>

Aeroview is a developer-friendly, AI-powered observability platform that helps you monitor, troubleshoot, and optimize your applications. Get started for free at [https://aeroview.io](https://aeroview.io).
