import webext from "rollup-plugin-webext";

export default {
    input: {
        background: "src/background.js",
        page_action: "src/page_action.js",
        browser_action: "src/browser_action.js",
    },
    output: {
        dir: "dist/js",
        format: "esm",
        sourcemap: true,
    },
    plugins: [
        webext({
            dir: "dist",
        }),
    ],
};
