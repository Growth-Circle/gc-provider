#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { ENV_VAR } from "./constants.js";
import { resolveCatalog } from "./context.js";
import { renderDiff } from "./diff.js";
import { ADAPTER_IDS, ADAPTERS, MANUAL_CLIENTS, findAdapter } from "./registry.js";
const TIERS = ["free", "paid", "team"];
async function main(argv) {
    let options;
    try {
        options = parseArgs(argv);
    }
    catch (error) {
        process.stderr.write(`${red(String(error instanceof Error ? error.message : error))}\n`);
        return 2;
    }
    if (options.command === "help") {
        process.stdout.write(helpText());
        return 0;
    }
    if (options.command === "version") {
        process.stdout.write(`${packageVersion()}\n`);
        return 0;
    }
    const apiKey = process.env[ENV_VAR]?.trim();
    const catalog = await resolveCatalog({
        apiKey,
        tier: options.tier,
        offline: options.offline,
    });
    const ctx = { catalog, home: homedir(), cwd: process.cwd() };
    const probe = { exists: existsSync, hasBinary };
    const selected = selectAdapters(options, ctx, probe);
    if (options.command === "status") {
        printStatus(ctx, probe);
        return 0;
    }
    if (selected.length === 0) {
        process.stdout.write(`${yellow("No supported client detected.")}\n` +
            `Pass --all to write configs anyway, or name one: ${ADAPTER_IDS.join(", ")}\n`);
        return 1;
    }
    printCatalogBanner(ctx);
    const read = (path) => (existsSync(path) ? readFileSync(path, "utf8") : null);
    const plans = [];
    for (const adapter of selected) {
        const edits = options.command === "uninstall" ? adapter.uninstall(ctx, read) : adapter.install(ctx, read);
        if (edits.length > 0)
            plans.push({ adapter, edits });
    }
    const writable = plans.filter(({ edits }) => edits.some((edit) => !edit.blocked));
    const blocked = plans.flatMap(({ adapter, edits }) => edits.filter((edit) => edit.blocked).map((edit) => ({ adapter, edit })));
    for (const { adapter, edit } of blocked) {
        process.stdout.write(`${yellow("skip")} ${adapter.label}: ${edit.blocked} (${tildify(edit.path)})\n`);
    }
    if (writable.length === 0) {
        process.stdout.write(`${green("Nothing to do.")} Every selected client is already up to date.\n`);
        return blocked.length > 0 ? 1 : 0;
    }
    for (const { adapter, edits } of writable) {
        for (const edit of edits) {
            if (edit.blocked)
                continue;
            printEdit(adapter, edit);
        }
    }
    if (options.dryRun) {
        process.stdout.write(`\n${bold("--dry-run:")} nothing was written.\n`);
        return 0;
    }
    if (!options.yes) {
        const approved = await confirm(`Apply the change(s) above?`);
        if (!approved) {
            process.stdout.write("Aborted. No files were changed.\n");
            return 1;
        }
    }
    const written = [];
    for (const { adapter, edits } of writable) {
        for (const edit of edits) {
            if (edit.blocked)
                continue;
            applyEdit(edit);
            written.push(`${adapter.label}: ${tildify(edit.path)}`);
        }
    }
    process.stdout.write(`\n${green(options.command === "uninstall" ? "Removed." : "Done.")}\n`);
    for (const line of written)
        process.stdout.write(`  ${line}\n`);
    if (options.command === "setup")
        printNextSteps(ctx, writable.map(({ adapter }) => adapter), apiKey);
    return 0;
}
function selectAdapters(options, ctx, probe) {
    if (options.clients.length > 0) {
        return options.clients.map((id) => {
            const adapter = findAdapter(id);
            if (!adapter)
                throw new Error(`Unknown client "${id}". Known: ${ADAPTER_IDS.join(", ")}`);
            return adapter;
        });
    }
    if (options.all)
        return [...ADAPTERS];
    return ADAPTERS.filter((adapter) => adapter.detect(ctx, probe));
}
function printCatalogBanner(ctx) {
    const { catalog } = ctx;
    const source = catalog.source === "live"
        ? `${green("live")} catalog from GrowthCircle.id`
        : `${yellow("bundled")} catalog (${catalog.fallbackReason})`;
    process.stdout.write(`${bold("GrowthCircle.id")}  tier=${catalog.tier}  models=${catalog.modelIds.length}  ${source}\n` +
        `default model: ${catalog.defaultModelId}\n\n`);
}
function printEdit(adapter, edit) {
    const action = edit.after === null ? red("delete") : edit.before === null ? green("create") : "update";
    process.stdout.write(`${bold(adapter.label)}  ${action} ${tildify(edit.path)}\n`);
    for (const line of edit.summary)
        process.stdout.write(`  · ${line}\n`);
    if (edit.after === null) {
        process.stdout.write("\n");
        return;
    }
    for (const line of renderDiff(edit.before, edit.after)) {
        process.stdout.write(`  ${colorizeDiff(line)}\n`);
    }
    process.stdout.write("\n");
}
function applyEdit(edit) {
    if (edit.before !== null) {
        const stamp = new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d+Z$/u, "Z");
        copyFileSync(edit.path, `${edit.path}.bak.${stamp}`);
    }
    if (edit.after === null) {
        rmSync(edit.path, { force: true });
        return;
    }
    mkdirSync(dirname(edit.path), { recursive: true });
    writeFileSync(edit.path, edit.after, "utf8");
}
function printNextSteps(ctx, adapters, apiKey) {
    process.stdout.write(`\n${bold("Set your key")}\n`);
    if (apiKey) {
        process.stdout.write(`  ${ENV_VAR} is already set in this shell.\n`);
    }
    else {
        process.stdout.write(`  export ${ENV_VAR}="gc-paid-..."   # add to ~/.bashrc or ~/.zshrc\n`);
    }
    const extras = adapters.flatMap((adapter) => adapter.extraEnv?.(ctx) ?? []);
    const seen = new Set();
    for (const extra of extras) {
        if (seen.has(extra.name))
            continue;
        seen.add(extra.name);
        process.stdout.write(`  export ${extra.name}="${extra.value}"\n      ${dim(extra.note)}\n`);
    }
    process.stdout.write(`\n${bold("Then")}\n`);
    for (const adapter of adapters) {
        process.stdout.write(`  ${adapter.label}\n`);
        for (const line of adapter.usage(ctx))
            process.stdout.write(`    ${line}\n`);
    }
}
function printStatus(ctx, probe) {
    printCatalogBanner(ctx);
    process.stdout.write(`${bold("Automated clients")}\n`);
    const read = (path) => (existsSync(path) ? readFileSync(path, "utf8") : null);
    for (const adapter of ADAPTERS) {
        const detected = adapter.detect(ctx, probe);
        const configured = detected && adapter.install(ctx, read).length === 0;
        const mark = !detected ? dim("not installed") : configured ? green("configured") : yellow("not configured");
        process.stdout.write(`  ${adapter.id.padEnd(12)} ${mark}\n`);
    }
    process.stdout.write(`\n${bold("Manual clients")}\n`);
    for (const client of MANUAL_CLIENTS) {
        const mark = client.status === "manual" ? yellow("manual setup") : red("not supported");
        process.stdout.write(`  ${client.id.padEnd(12)} ${mark}  ${dim(client.note)}\n`);
    }
}
function parseArgs(argv) {
    const options = {
        command: "setup",
        clients: [],
        yes: false,
        dryRun: false,
        all: false,
        offline: false,
    };
    let index = 0;
    const first = argv[0];
    if (first && !first.startsWith("-")) {
        if (first === "setup" || first === "uninstall" || first === "status") {
            options.command = first;
            index = 1;
        }
        else if (first === "help") {
            return { ...options, command: "help" };
        }
    }
    for (; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--yes" || arg === "-y")
            options.yes = true;
        else if (arg === "--dry-run" || arg === "-n")
            options.dryRun = true;
        else if (arg === "--all")
            options.all = true;
        else if (arg === "--offline")
            options.offline = true;
        else if (arg === "--help" || arg === "-h")
            return { ...options, command: "help" };
        else if (arg === "--version" || arg === "-V")
            return { ...options, command: "version" };
        else if (arg === "--tier") {
            const value = argv[index + 1];
            if (!value || !isTier(value))
                throw new Error(`--tier expects one of: ${TIERS.join(", ")}`);
            options.tier = value;
            index += 1;
        }
        else if (arg.startsWith("--tier=")) {
            const value = arg.slice("--tier=".length);
            if (!isTier(value))
                throw new Error(`--tier expects one of: ${TIERS.join(", ")}`);
            options.tier = value;
        }
        else if (arg.startsWith("-")) {
            throw new Error(`Unknown flag "${arg}". Run  gc-provider --help`);
        }
        else {
            options.clients.push(arg);
        }
    }
    return options;
}
function isTier(value) {
    return TIERS.includes(value);
}
async function confirm(question) {
    if (!process.stdin.isTTY) {
        process.stdout.write(`${yellow("Not a TTY;")} re-run with --yes to apply without a prompt.\n`);
        return false;
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase();
        return answer === "y" || answer === "yes";
    }
    finally {
        rl.close();
    }
}
/** PATH lookup without spawning a shell. */
function hasBinary(name) {
    const paths = (process.env.PATH ?? "").split(delimiter).filter((entry) => entry.length > 0);
    const extensions = process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
    return paths.some((dir) => extensions.some((ext) => existsSync(join(dir, `${name}${ext}`))));
}
function tildify(path) {
    const home = homedir();
    return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}
function packageVersion() {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (let depth = 0; depth < 6; depth += 1) {
        const candidate = join(dir, "package.json");
        if (existsSync(candidate)) {
            try {
                const pkg = JSON.parse(readFileSync(candidate, "utf8"));
                if (pkg.name === "gc-provider" && pkg.version)
                    return pkg.version;
            }
            catch {
                // keep walking up
            }
        }
        const parent = dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return "unknown";
}
const useColor = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;
const wrap = (code) => (text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);
const bold = wrap("1");
const dim = wrap("2");
const red = wrap("31");
const green = wrap("32");
const yellow = wrap("33");
function colorizeDiff(line) {
    if (line.startsWith("+"))
        return green(line);
    if (line.startsWith("-"))
        return red(line);
    if (line.trimStart().startsWith("…"))
        return dim(line);
    return line;
}
function helpText() {
    return `gc-provider ${packageVersion()} — wire GrowthCircle.id into your AI coding clients

Usage
  npx gc-provider setup [client...]       write provider config (default command)
  npx gc-provider uninstall [client...]   remove what setup wrote
  npx gc-provider status                  show what is detected and configured

Clients
  ${ADAPTER_IDS.join(", ")}

Options
  -y, --yes         apply without the confirmation prompt
  -n, --dry-run     show the diff and exit without writing
      --all         target every client, not only detected ones
      --offline     skip the live /models lookup, use the bundled catalog
      --tier <t>    force free | paid | team instead of reading the key prefix
  -h, --help        this text
  -V, --version     print the version

Notes
  The API key is never written to a config file. Export ${ENV_VAR}
  and the generated configs reference it by name.

  Every modified file is backed up to <file>.bak.<timestamp> first.
`;
}
const exitCode = await main(process.argv.slice(2));
process.exitCode = exitCode;
