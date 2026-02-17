[![npm version](https://img.shields.io/npm/v/@accesslint/storybook-addon)](https://www.npmjs.com/package/@accesslint/storybook-addon)
[![license](https://img.shields.io/github/license/AccessLint/storybook-addon)](https://github.com/AccessLint/storybook-addon/blob/main/LICENSE)

# @accesslint/storybook-addon

Catch accessibility violations in your Storybook stories as you develop. Powered by [@accesslint/core](https://accesslint.com/core).

<img width="637" height="414" alt="Storybook screenshot with alt text violation in the details of the AccessLint tab" src="https://github.com/user-attachments/assets/01d2de92-0769-4564-8971-f6edc1986010" />


## Getting Started

```sh
npm install @accesslint/storybook-addon
```

Add the addon to your `.storybook/main.ts` (or `.storybook/main.js`):

```ts
const config = {
  addons: ["@storybook/addon-vitest", "@accesslint/storybook-addon"],
};

export default config;
```

Add the vitest plugin to your `vite.config.ts`:

```ts
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { accesslintTest } from "@accesslint/storybook-addon/vitest-plugin";

export default defineConfig({
  plugins: [
    storybookTest({ configDir: ".storybook" }),
    accesslintTest(),
  ],
});
```

Restart Storybook and an **AccessLint** panel will appear in the addon bar.

## Usage

The addon audits each story after it renders and displays violations sorted by severity. Expand any violation to see:

- **Impact level** — critical, serious, moderate, or minor
- **WCAG criteria** and conformance level (A, AA, AAA)
- **How to fix** guidance for each rule
- **Element HTML** snippet of the failing element

## Configuration

### Parameters

Control AccessLint behavior per-story or globally via `parameters.accesslint`:

```ts
// .storybook/preview.ts
const preview = {
  parameters: {
    accesslint: {
      // 'todo' - show violations as warnings in the test UI
      // 'error' - fail CI on violations
      // 'off' - skip checks entirely
      test: "todo",
    },
  },
};

export default preview;
```

### Disabling rules

Disable specific rules in your preview file:

```ts
// .storybook/preview.ts
import { configureRules } from "@accesslint/core";

configureRules({
  disabledRules: ["accesslint-045"], // e.g. disable landmark region rule
});
```

## Compatibility

| Addon version | Storybook version |
| ------------- | ----------------- |
| 0.6.x         | 10.x              |

## Issues

Please report issues in the [AccessLint core repository](https://github.com/AccessLint/core/issues).

## License

MIT
