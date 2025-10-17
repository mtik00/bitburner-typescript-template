// @ts-nocheck
import { NS } from "@ns";
import { execHack, getThreads } from './helpers.js'

export async function main(ns: NS) {
    const options = ns.flags([
        ['script', 'v1-hack.js'],
        ['ram', 128],
        ['target', ''],
    ]);

    const ram = options.ram
    const hack_script = options.script
    const target = options.target.toString()
    const serverLimit = ns.getPurchasedServerLimit()
    const purchasedServers = ns.getPurchasedServers()
    const serverCost = ns.getPurchasedServerCost(ram)

    if (purchasedServers.length >= serverLimit) {
        ns.tprintf("ERROR: You have purchased the maximum number of servers")
        return
    } else if (target === '') {
        ns.tprint("USAGE: ./purchaseServer.ts --target <hostname>")
        return
    }

    ns.printf("Purchasing up to %i servers with %iGB RAM", serverLimit, ram);

    let i = purchasedServers.length;

    // Continuously try to purchase servers until we've reached the maximum
    // amount of servers
    while (i < serverLimit) {
        // Check if we have enough money to purchase a server
        if (ns.getServerMoneyAvailable("home") > serverCost) {
            // If we have enough money, then:
            //  1. Purchase the server
            //  2. Copy our hacking script onto the newly-purchased server
            //  3. Run our hacking script on the newly-purchased server with 3 threads
            //  4. Increment our iterator to indicate that we've bought a new server
            const svr_name = ns.sprintf("pserv-%03i", i + 1)
            const hostname = ns.purchaseServer(svr_name, ram)

            execHack(ns, target, hack_script, false, hostname);

            ++i;
        }
        //Make the script wait for a second before looping again.
        //Removing this line will cause an infinite loop and crash the game.
        await ns.sleep(1000);
    }
}

export function autocomplete(data, args) {
    data.flags([
        ['script', 'v1-hack.js'],
        ['ram', 128],
        ['target', ''],
    ]);

    const lastFlag = args.length > 1 ? args[args.length - 2] : null;
    if (["--target"].includes(lastFlag)) {
        return data.servers;
    } else if (["--ram"].includes(lastFlag))
        return [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];
    return [];
}
