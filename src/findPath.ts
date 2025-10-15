import { NS } from "@ns";
import { connectCommand } from "helpers"

export async function main(ns: NS) {
    let startServer = ns.getHostname()
    let target = ns.args[0].toString()
    ns.tprint(
        connectCommand(ns, target, startServer)
    )
}

export function autocomplete(data: any, args: any) {
    return data.servers;
}
