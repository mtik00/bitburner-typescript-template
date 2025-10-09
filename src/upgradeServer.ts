// @ts-nocheck
import { NS } from "@ns";
import { getThreads } from './helpers.js'

/*
This script used to replace a purchased server with a server with more RAM.

The default is to double the RAM and keep the same script+args.  You can specify exact ram using `--ram`.

Run `./purchasedServerInfo.js` to view current servers, RAM, and actions.
*/
export async function main(ns: NS) {
    const options = ns.flags([
        ['server', ''],
        ['script', 'v1-hack.js'],
        ['target', 'n00dles'],
        ['ram', 0],
    ]);

    const server = options.server.toString();
    const availableMoney = ns.getServerMoneyAvailable("home")

    if (server === "") {
        ns.tprint(`USAGE: ${ns.getScriptName()} --server <name>`);
        return
    } else if (!ns.getPurchasedServers().includes(server)) {
        ns.tprint("ERROR: You have not purchased: ", server)
        return
    }

    const currentRam = ns.getServerMaxRam(server)
    const ram = options.ram > 0 ? options.ram : currentRam * 2
    const serverCost = ns.getPurchasedServerUpgradeCost(server, ram)
    const processes = ns.ps(server)
    let script = options.script
    let args: string[] = ["--target", options.target]

    if (processes.length > 0) {
        script = processes[0].filename
        args = processes[0].args
    }

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
    ns.upgradePurchasedServer(server, ram)
    ns.tprintf("Upgraded %s for $%s", server, ns.formatNumber(serverCost))

    let threads = getThreads(ns, script, server);

    ns.printf("hacking %s with %s and %i threads", server, script, threads);
    ns.scp(script, server);
    ns.exec(script, server, threads, ...args);
}
