import { NS } from "@ns";
import { getThreads } from "./helpers";

interface FlagsSchema {
    script: string;
    target: string;
    homeRamAdjust: number;
    maxRam: boolean;
}

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['script', 'v1-hack.js'],
    ['target', 'home'],
    ['homeRamAdjust', 32],
    ['maxRam', false],
]

export async function main(ns: NS) {
    const options = ns.flags(argsSchema) as unknown as FlagsSchema

    const threads = getThreads(
        ns,
        options.script,
        options.target,
        options.homeRamAdjust,
        options.maxRam,
    )

    ns.tprintf(
        "Maximum threads for %s on server %s: %s",
        options.script,
        options.target,
        threads,
    )
}
