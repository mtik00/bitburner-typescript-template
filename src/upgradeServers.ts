// @ts-nocheck
import { NS, Server } from "@ns";
import { getThreads, createFlagAutocomplete, RAM, filterHackableServers } from './helpers.js'

/*
This script used to replace a purchased server with a server with more RAM.

The default is to double the RAM and keep the same script+args.  You can specify exact ram using `--ram`.

Run `./purchasedServerInfo.js` to view current servers, RAM, and actions.
*/
export async function main(ns: NS) {
    const options = ns.flags([
        ['script', 'v1-hack.js'],
        ['target', 'n00dles'],
        ['ram'],
        ['startWith', 0]
    ]);

    if (options.ram === undefined) {
        ns.tprint("ERROR: missing --ram flag")
        return
    }

    const startWith = parseInt(options.startWith)
    const ram = parseInt(options.ram)

    for (const server: string of ns.getPurchasedServers().slice(startWith)) {
        if (ns.getServerMaxRam(server) >= ram) {
            ns.tprintf("ERROR: Server %s already has %s RAM", server, ns.formatRam(ram, 0))
            return
        }

        const serverCost = ns.getPurchasedServerUpgradeCost(server, ram)
        const processes = ns.ps(server)
        let script = options.script
        let args: string[] = ["--target", options.target]

        if (processes.length > 0) {
            script = processes[0].filename
            args = processes[0].args
            ns.tprintf("WARN: input target %s ignored", options.target)
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
}

export function autocomplete(data: any, args: any) {
    return createFlagAutocomplete({
        "--ram": RAM,
        "--target": (data: any) => filterHackableServers(data),
        "--script": (data: any) => data.scripts,
        "--startsWith": Array.from({ length: 25 }, (_, i) => i.toString())
    })(data, args);
}
