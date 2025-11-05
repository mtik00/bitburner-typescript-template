import { NS } from "@ns";
import { connect } from "/lib/path";
import { filterHackableServers } from "./lib/autocomplete";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0];
    if (target === undefined) {
        ns.tprint(`USAGE: ${ns.getScriptName()} <target>`)
        ns.tprint("...This script will connect you to the target server")
        return
    }

    connect(ns, target.toString())
}

export function autocomplete(data: any, args: any) {
    return filterHackableServers(data);
}
