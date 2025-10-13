// @ts-nocheck
import { NS } from "@ns";
import { openServer } from "./helpers";

const argsSchema = [
    ['target', ''],
];


export async function main(ns: NS) {
    const options = ns.flags(argsSchema);

    if (options.target.length === 0) {
        ns.tprint("USAGE: nuke --target <target>");
        return
    }

    openServer(ns, options.target);
    ns.nuke(options.target);
}
