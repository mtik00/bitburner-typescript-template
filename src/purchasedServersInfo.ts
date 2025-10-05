// @ts-nocheck
import { NS } from "@ns";
import { getServerAction } from "helpers"

export async function main(ns: NS) {

    const purchasedServers = ns.getPurchasedServers().sort();
    for (let index = 0; index < purchasedServers.length; index++) {
        const server = purchasedServers[index];
        const ram = ns.getServerMaxRam(server);
        const action = getServerAction(ns, server)
        ns.tprintf("%s: %s %s", server, ns.formatRam(ram), action)
    }
}
