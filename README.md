[![npm version](https://img.shields.io/npm/v/@accesslint/storybook-addon)](https://www.npmjs.com/package/@accesslint/storybook-addon)
[![npm downloads](https://img.shields.io/npm/dm/@accesslint/storybook-addon)](https://www.npmjs.com/package/@accesslint/storybook-addon)
[![license](https://img.shields.io/github/license/AccessLint/storybook-addon)](https://github.com/AccessLint/storybook-addon/blob/main/LICENSE)

# @accesslint/storybook-addon

Catch accessibility violations in your Storybook stories as you develop. Powered by [@accesslint/core](https://core.accesslint.com).

<img width="637" height="414" alt="Storybook screenshot with alt text violation in the details of the AccessLint tab" src="https://github.com/user-attachments/assets/01d2de92-0769-4564-8971-f6edc1986010" />


## Getting Started

```sh
npm install @accesslint/storybook-addon
```

Then add it to your `.storybook/main.ts` (or `.storybook/main.js`):

```ts
const config = {
  addons: ["@accesslint/storybook-addon"],
};

export default config;
```

That's it. Restart Storybook and an **AccessLint** panel will appear in the addon bar.

## Usage

The addon automatically audits each story on render and displays violations sorted by severity. Expand any violation to see:

- **Impact level** — critical, serious, moderate, or minor
- **WCAG criteria** and conformance level (A, AA, AAA)
- **How to fix** guidance for each rule
- **Element HTML** snippet of the failing element

Selecting a violation highlights the affected element in the story preview.

## Configuration

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
| 0.6.x         | 8.6.x             |

## Issues

Please report issues in the [AccessLint core repository](https://github.com/AccessLint/core/issues).

## License

MIT
