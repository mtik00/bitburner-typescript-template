// @ts-nocheck
import { NS } from "@ns";

export async function main(ns: NS) {

    const purchasedServers = ns.getPurchasedServers().sort();
    for (let index = 0; index < purchasedServers.length; index++) {
        const server = purchasedServers[index];
        const ram = ns.getServerMaxRam(server);
        ns.tprintf("%s: %s", server, ns.formatRam(ram))
    }
}
