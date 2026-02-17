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
  test: {
    projects: [
      {
        plugins: [
          storybookTest({ configDir: ".storybook" }),
          accesslintTest(),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
```

Restart Storybook and an **AccessLint** panel will appear in the addon bar.

## Usage

The addon audits each story after it renders and displays violations sorted by severity. Expand any violation to see:

- **Impact level** — critical, serious, moderate, or minor
- **WCAG criteria** and conformance level (A, AA, AAA)
- **How to fix** guidance for each rule
- **Element HTML** snippet of the failing element

### Sidebar status indicators

Each story gets a colored dot in the sidebar tree showing its accessibility status:

- Green — no violations
- Yellow — violations present, but running in `"todo"` mode (warnings)
- Red — violations present in `"error"` mode (failures)

Click a status dot to jump to the AccessLint panel for that story. Right-click any story in the sidebar to access "View AccessLint results".

### Test widget

The AccessLint test provider widget appears in the sidebar's testing module alongside Storybook's built-in component tests. It shows the current story's violation count and responds to the global "Run all" and "Clear all" buttons.

## Configuration

### Parameters

Control AccessLint behavior per-story or globally via `parameters.accesslint`:

```ts
// .storybook/preview.ts
const preview = {
  parameters: {
    accesslint: {
      // 'todo' - show violations as warnings in the test UI (non-blocking)
      // 'error' - fail CI on violations
      // 'off' - skip checks entirely
      test: "todo",
    },
  },
};

export default preview;
```

Override per-story:

```ts
export const Experimental = {
  parameters: {
    accesslint: { test: "off" },
  },
};
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

### Skipping stories with tags

Tag stories with `"no-a11y"` to skip AccessLint auditing:

```ts
export const Prototype = {
  tags: ["no-a11y"],
};
```

The tag can also be set at the component level to skip all stories for a component:

```ts
export default {
  title: "Prototypes/ExperimentalWidget",
  component: ExperimentalWidget,
  tags: ["no-a11y"],
};
```

You can also configure the `accesslintTest()` plugin with custom skip tags:

```ts
accesslintTest({
  tags: { skip: ["no-a11y", "wip"] },
});
```

## Accessibility assertions in play functions

The `toBeAccessible()` matcher lets you make accessibility a first-class assertion in interaction tests and play functions.

### Setup

Import the matchers entry point in your test setup or directly in a story file:

```ts
import "@accesslint/storybook-addon/matchers";
```

For TypeScript support, add the type reference to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@accesslint/storybook-addon/matchers"]
  }
}
```

Or add a triple-slash reference in a `.d.ts` file:

```ts
/// <reference types="@accesslint/storybook-addon/matchers" />
```

### Usage in a play function

```ts
import { expect } from "storybook/test";
import "@accesslint/storybook-addon/matchers";

export const Default = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeAccessible();
  },
};
```

### Usage in a standalone Vitest test

```ts
import "@accesslint/storybook-addon/matchers";
import { render } from "@testing-library/react";

test("LoginForm is accessible", () => {
  const { container } = render(<LoginForm />);
  expect(container).toBeAccessible();
});
```

### Options

Pass options to disable specific rules for a single assertion:

```ts
await expect(canvasElement).toBeAccessible({
  disabledRules: ["accesslint-045"],
});
```

### Failure output

When the assertion fails, the error message lists each violation with its rule ID, WCAG criteria, conformance level, message, and the CSS selector of the failing element:

```
Expected element to have no accessibility violations, but found 2:

  accesslint-001 [A] (1.1.1): Image is missing alt text
    img[src="hero.png"]

  accesslint-012 [A] (1.3.1): Form input is missing a label
    input[type="email"]
```

## Portable stories

Use AccessLint with `composeStories` outside of Storybook (plain Vitest, Jest, or Playwright CT).

### Setup

In your test setup file, pass the AccessLint annotations to `setProjectAnnotations`:

```ts
// vitest.setup.ts
import { setProjectAnnotations } from "@storybook/react";
import { enableAccessLint } from "@accesslint/storybook-addon/portable";
import * as previewAnnotations from "./.storybook/preview";

const project = setProjectAnnotations([
  previewAnnotations,
  enableAccessLint(),
]);

beforeAll(project.beforeAll);
```

### Usage

```ts
import { composeStories } from "@storybook/react";
import * as stories from "./Button.stories";

const { Primary } = composeStories(stories);

test("Primary button is accessible", async () => {
  await Primary.run();
  // AccessLint afterEach runs automatically via the annotations
});
```

## API reference

### Exports

| Entry point | Description |
| --- | --- |
| `@accesslint/storybook-addon` | Main addon registration (manager + preview) |
| `@accesslint/storybook-addon/vitest-plugin` | `accesslintTest()` Vite plugin for Vitest integration |
| `@accesslint/storybook-addon/vitest-setup` | Setup file registered by the Vite plugin |
| `@accesslint/storybook-addon/matchers` | `toBeAccessible()` custom Vitest/Jest matcher |
| `@accesslint/storybook-addon/portable` | `enableAccessLint()` for portable stories |
| `@accesslint/storybook-addon/preview` | Preview annotations (afterEach hook) |

### `accesslintTest(options?)`

Vite plugin that registers AccessLint's `afterEach` annotation for Vitest story tests.

```ts
import { accesslintTest } from "@accesslint/storybook-addon/vitest-plugin";

accesslintTest();
accesslintTest({ tags: { skip: ["no-a11y"] } });
```

**Options:**

| Option | Type | Description |
| --- | --- | --- |
| `tags.skip` | `string[]` | Stories with any of these tags will not be audited |

### `parameters.accesslint`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `test` | `"todo" \| "error" \| "off"` | `"error"` | `"todo"` reports violations as warnings. `"error"` fails the test. `"off"` skips auditing. |
| `disable` | `boolean` | `false` | Set to `true` to skip auditing (same as `test: "off"`) |

### `toBeAccessible(options?)`

Custom matcher for asserting an element has no accessibility violations.

```ts
expect(element).toBeAccessible();
expect(element).toBeAccessible({ disabledRules: ["accesslint-045"] });
```

**Options:**

| Option | Type | Description |
| --- | --- | --- |
| `disabledRules` | `string[]` | Rule IDs to skip for this assertion |

### `enableAccessLint()`

Returns AccessLint's preview annotations for use with `setProjectAnnotations` in portable stories setups.

```ts
import { enableAccessLint } from "@accesslint/storybook-addon/portable";
```

## Compatibility

| Addon version | Storybook version |
| ------------- | ----------------- |
| 0.6.x         | 10.x              |

## Issues

Please report issues in the [AccessLint core repository](https://github.com/AccessLint/core/issues).

## License

MIT
