// @ts-nocheck
import { NS } from "@ns";
import { getThreads } from "./helpers";

const argsSchema = [
    ['script', 'v1-hack.js'],
    ['target', 'home'],
    ['homeRamAdjust', 16],
    ['maxRam', false],
];

export async function main(ns: NS) {
    const options = ns.flags(argsSchema);

    const target = options.target;
    const script = options.script;
    const threads = getThreads(ns, script, target, options.homeRamAdjust, options.maxRam)

    ns.tprintf(
        "Maximum threads for %s on server %s: %s",
        script,
        target,
        threads,
    )
}
