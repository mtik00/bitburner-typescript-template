// @ts-nocheck
import { NS } from "@ns";
import { getThreads } from './helpers.js'

/*
This script used to replace a purchased server with a server with more RAM.

The default is to double the RAM.  You can specify exact ram using `--ram`.

Run `./purchasedServerInfo.js` to view current servers and RAM.
*/
export async function main(ns: NS) {
    const options = ns.flags([
        ['server', ''],
        ['script', 'v1-hack.js'],
        ['ram', 0],
    ]);

    const hack_script = options.script.toString();
    const server = options.server.toString();
    const availableMoney = ns.getServerMoneyAvailable("home")

    if (server.length === 0) {
        ns.tprint("USAGE: upgradeServer.js --server <name>");
        return
    } else if (!ns.getPurchasedServers().includes(server)) {
        ns.tprint("ERROR: You have not purchased: ", server)
        return
    }

    const currentRam = ns.getServerMaxRam(server)
    const ram = options.ram > 0 ? options.ram : currentRam * 2
    const serverCost = ns.getPurchasedServerCost(ram)

    if (ns.getServerMaxRam(server) >= ram) {
        ns.tprintf("ERROR: Server %s already has %s RAM", server, ns.formatRam(ram, 0))
        return
    } else if (availableMoney < serverCost) {
        ns.tprintf(
            "ERROR: A %s server costs you $%s, but you only have $%s",
            ns.formatRam(ram, 0),
            ns.formatNumber(serverCost),
            ns.formatNumber(availableMoney),
        )
        return
    }

    ns.tprintf(
        "---- Upgrading %s from %s to %s",
        server,
        ns.formatRam(ns.getServerMaxRam(server), 0),
        ns.formatRam(ram, 0),
    );

    ns.killall(server)  // Can't delete the server if scripts are running
    ns.deleteServer(server)
    ns.purchaseServer(server, ram)

    let threads = getThreads(ns, hack_script, server);

    ns.printf("hacking %s with %s and %i threads", server, hack_script, threads);
    ns.scp(hack_script, server);
    ns.exec(hack_script, server, threads);
}
