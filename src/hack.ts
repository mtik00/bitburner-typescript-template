// @ts-nocheck
import { NS } from "@ns";
import { execHack } from './helpers.js'

const argsSchema = [
    ['target', ''],
    ['script', 'v1-hack.js'],
    ['force', false],
    ['host', ''],
];

export async function main(ns: NS) {
    const options = ns.flags(argsSchema);

    if (options.target.length === 0) {
        ns.tprint("USAGE: hack --target <target>");
        return
    }

    execHack(ns, options.target, options.script, options.force, options.host);
}
