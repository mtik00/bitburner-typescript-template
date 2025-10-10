// @ts-nocheck
import { NS } from "@ns";
import { getServerAction, scanAllServers } from "helpers"

export async function main(ns: NS) {

    const allServers = scanAllServers(ns, true).sort()
    for (let index = 0; index < allServers.length; index++) {
        const server = allServers[index]
        const ram = ns.getServerMaxRam(server)
        const action = getServerAction(ns, server)

        if (action) {
            ns.tprintf("%20s: %s %s", server, ns.formatRam(ram), action)
        }
    }
}
