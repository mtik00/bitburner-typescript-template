// @ts-nocheck
import { NS } from "@ns";
import { openServer } from "./helpers";
import { filterHackableServers } from "./lib/autocomplete";

const argsSchema = [
    ['target', ''],
];


export async function main(ns: NS) {
    const options = ns.flags(argsSchema);
    let target = options.target.toString()

    if ((target.length === 0) && (options._.length > 0)) {
        target = options._[0]
    } else if (target.length === 0) {
        ns.tprint("USAGE: nuke <target>");
        return
    }

    openServer(ns, target)
    ns.nuke(target)

    ns.tprintf("Opened and NUKE'd %s", target)

    if (ns.getServer(target).backdoorInstalled) {
        ns.tprint("... backdoor already installed")
    } else {
        ns.tprint("... backdoor NOT installed")
    }
}

export function autocomplete(data, args) {
    return filterHackableServers(data);
}
