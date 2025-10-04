// @ts-nocheck
import { NS } from "@ns";

const argsSchema = [
    ['target', ''],
];


export async function main(ns: NS) {
    const options = ns.flags(argsSchema);

    if (options.target.length === 0) {
        ns.tprint("USAGE: hack --target <target>");
        return
    }

    ns.nuke(options.target);
}
