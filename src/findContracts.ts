import { NS } from "@ns";
import { scanAllServers, connectCommand } from "./helpers";

export async function main(ns: NS): Promise<void> {
    let found = false
    scanAllServers(ns).forEach(server => {
        const res = ns.ls(server, '.cct')
        if (res.length > 0) {
            ns.tprint("Found contract on:", server)
            ns.tprint("    ", connectCommand(ns, server))
            found = true
        }
    });

    if (!found) {
        ns.tprint("No contracts found")
    }
}
