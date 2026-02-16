# @accesslint/storybook-addon

Storybook addon for accessibility auditing powered by [@accesslint/core](https://core.accesslint.com). Automatically runs accessibility checks on every story and displays violations in a dedicated panel.

## Installation

```sh
npm install @accesslint/storybook-addon
```

## Setup

Add the addon to your `.storybook/main.ts`:

```ts
const config = {
  addons: ["@accesslint/storybook-addon"],
};

export default config;
```

## Usage

Once installed, an **Accessibility** panel appears in the Storybook addon bar. It automatically audits each story on render and reports any violations with the rule ID, message, and affected selector.

## License

MIT
