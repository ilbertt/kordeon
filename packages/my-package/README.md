# @repo/my-package

A template internal package inside the kordeon monorepo.

It is consumed directly from TypeScript source by other workspaces via its `@repo/my-package` name — there is no build step, and it is not published to npm.

## Usage

```ts
import { helloWorld } from '@repo/my-package';
```
