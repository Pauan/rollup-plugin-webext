# rollup-plugin-webext

This is a Rollup plugin that makes it easy to build, run, and test
[WebExtensions](https://wiki.mozilla.org/WebExtensions).

It supports creating both [Firefox Extensions](https://developer.mozilla.org/en-US/Add-ons/WebExtensions) and
[Chrome Extensions](https://developer.chrome.com/docs/extensions/).

Internally this plugin uses [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/), which is automatically installed.

## Installation

```sh
# If you are using npm
npm install --save-dev rollup-plugin-webext
```

```sh
# If you are using yarn
yarn add --dev rollup-plugin-webext
```

## Usage

Just import the plugin and add it into your `plugins` inside of `rollup.config.js`:

```js
import webext from "rollup-plugin-webext";

export default {
    plugins: [
        webext()
    ]
};
```

* When running Rollup in watch mode, it will automatically launch the browser with your extension installed.

   Whenever you change a file, it will automatically reload the extension. This is very useful for development.

* When running Rollup in build mode, it will create a `.zip` file inside of the `web-ext-artifacts` folder.

   That `.zip` file contains your extension code. You can then publish that `.zip` file to the [Chrome](https://chrome.google.com/webstore/category/extensions) / [Firefox](https://addons.mozilla.org/en-US/firefox/) extension websites.

   When publishing Firefox extensions, you need to [sign your extension](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/).

It is recommended to use the [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) package, so that way your extension will work in both Firefox and Chrome.

### Options

These are the default options:

```js
webext({
    // The root directory for your extension.
    // By default this is the same as the `output.dir` setting in Rollup.
    dir: null,

    // URL which is opened in watch mode.
    // By default it loads an empty tab.
    url: null,

    // Automatically opens up the developer tools in watch mode.
    devtools: true,

    // Which browsers it should open in watch mode. You can specify multiple browsers.
    // The possible browsers are: "firefox-desktop", "firefox-android", and "chromium"
    targets: ["firefox-desktop"],

    // This allows you to specify a custom profile to use for the browser in watch mode.
    // The default creates a new empty profile.
    profiles: {
        firefox: null,
        chromium: null,
    },

    // This allows you to specify a custom binary for the browsers which are opened in watch mode.
    binaries: {
        firefox: null,
        chromium: null,
    },

    bundle: {
        // The filename for the .zip file which is created in build mode.
        // By default it uses the name and version of your extension.
        filename: null,

        // The directory for the .zip file which is created in build mode.
        dir: "web-ext-artifacts",
    },

    // Extra arguments which are passed to web-ext
    webExtArgs: [],
})
```

### Example

The [example](https://github.com/Pauan/rollup-plugin-webext/tree/master/example) directory contains a working example.
