import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as $path from "node:path";


class Queue {
    constructor() {
        this.pending = [];
        this.flushing = null;
    }

    runPending() {
        if (this.flushing === null && this.pending.length > 0) {
            this.flushing = (async () => {
                try {
                    while (this.pending.length > 0) {
                        const next = this.pending.shift();
                        await next();
                    }

                } finally {
                    if (this.pending.length !== 0) {
                        throw new Error("Invalid pending state");
                    }

                    if (this.flushing === null) {
                        throw new Error("Invalid flushing state");
                    }

                    this.flushing = null;
                }
            })();
        }
    }

    run(f) {
        return new Promise((resolve, reject) => {
            this.pending.push(async () => {
                try {
                    const value = await f();
                    resolve(value);

                } catch (e) {
                    reject(e);
                }
            });

            this.runPending();
        });
    }

    async flush() {
        if (this.flushing !== null) {
            await this.flushing;
        }

        if (this.pending.length !== 0) {
            throw new Error("Invalid pending state");
        }

        if (this.flushing !== null) {
            throw new Error("Invalid flushing state");
        }
    }
}


class WebExt {
    constructor() {
        this.killed = false;
        this.process = null;
        this.tmp = null;
        this.queue = new Queue();
    }

    async kill() {
        if (this.killed) {
            throw new Error("Cannot kill twice");
        }

        this.killed = true;

        const cleanupTmp = async () => {
            if (this.tmp !== null) {
                await rm(this.tmp, {
                    recursive: true,
                    force: true,
                });
            }
        };

        const killProcess = async () => {
            if (this.process !== null) {
                // TODO await for the process to close
                this.process.kill();
            }
        };

        const flushQueue = async () => {
            await this.queue.flush();
        };

        try {
            await Promise.all([
                cleanupTmp(),
                killProcess(),
                flushQueue(),
            ]);

        } finally {
            this.process = null;
            this.tmp = null;
        }
    }

    watchPath() {
        return $path.join(this.tmp, "watch");
    }

    async updateFile() {
        await writeFile(this.watchPath(), "" + Date.now());
    }

    async spawn(settings) {
        const tmpDir = await mkdtemp($path.join(tmpdir(), "rollup-plugin-webext-"));

        if (this.tmp !== null) {
            throw new Error("Invalid tmp state");
        }

        this.tmp = tmpDir;

        if (!this.killed) {
            await this.updateFile();
        }

        if (!this.killed) {
            const args = [
                "run",
                "--watch-file", this.watchPath(),
                "--no-input",
                "--source-dir", $path.resolve(settings.dir),
            ];

            if (settings.devtools) {
                args.push("--devtools");
            }

            if (settings.binaries != null) {
                if (settings.binaries.firefox != null) {
                    args.push("--firefox-binary", settings.binaries.firefox);
                }

                if (settings.binaries.chromium != null) {
                    args.push("--chromium-binary", settings.binaries.chromium);
                }
            }

            if (settings.targets != null) {
                settings.targets.forEach((target) => {
                    args.push("--target", target);
                });
            }

            if (settings.url != null) {
                args.push("--start-url", settings.url);
            }

            if (this.process !== null) {
                throw new Error("Invalid process state");
            }

            this.process = spawn("web-ext", args, {
                stdio: ["ignore", "inherit", "inherit"],
            });
        }
    }

    async update(settings) {
        this.queue.run(async () => {
            if (!this.killed) {
                if (this.process === null) {
                    await this.spawn(settings);

                } else {
                    await this.updateFile();
                }
            }
        });
    }

    async bundle(settings) {
        if (!this.killed) {
            const args = [
                "build",
                "--no-input",
                "--overwrite-dest",
                "--source-dir", $path.resolve(settings.dir),
            ];

            if (settings.bundle != null) {
                if (settings.bundle.filename != null) {
                    args.push("--filename", settings.bundle.filename);
                }

                if (settings.bundle.dir != null) {
                    args.push("--artifacts-dir", $path.resolve(settings.bundle.dir));
                }
            }

            // TODO ensure that it's killed properly ?
            spawn("web-ext", args, {
                stdio: ["ignore", "inherit", "inherit"],
            });
        }
    }
}


// TODO implement --config
// TODO implement --firefox-profile and --chromium-profile
// TODO implement --arg
export default function webExt(settings = {}) {
    if (settings.devtools == null) {
        settings.devtools = true;
    }

    if (settings.targets == null) {
        settings.targets = ["firefox-desktop"];
    }

    const state = new WebExt();

    return {
        name: "webext",
        async closeWatcher() {
            await state.kill();
        },
        async writeBundle(info, bundle) {
            const merged = Object.assign({
                dir: info.dir
            }, settings);

            if (!merged.dir) {
                throw new Error("Missing dir setting");
            }

            if (this.meta.watchMode) {
                await state.update(merged);

            } else {
                await state.bundle(merged);
            }
        },
    };
}
