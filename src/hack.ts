// @ts-nocheck
import { NS } from "@ns";
import { execHack } from './helpers.js'

const argsSchema = [
    ['server', ''],
    ['script', 'v1-hack.js'],
    ['force', false]
];

export async function main(ns: NS) {
    const options = ns.flags(argsSchema);

    if (options.server.length === 0) {
        ns.tprint("USAGE: hack --server <server>");
        return
    }

    execHack(ns, options.server, options.script, "home", options.force);
}
