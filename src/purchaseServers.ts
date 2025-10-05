// @ts-nocheck
import { NS } from "@ns";
import { execHack, getThreads } from './helpers.js'

export async function main(ns: NS) {
    const options = ns.flags([
        ['script', 'v1-hack.js'],
        ['ram', 16]
    ]);

    const ram = options.ram;
    const hack_script = options.script;
    const serverLimit = ns.getPurchasedServerLimit();
    const purchasedServers = ns.getPurchasedServers();
    const serverCost = ns.getPurchasedServerCost(ram)

    if (purchasedServers.length >= serverLimit) {
        ns.tprintf("ERROR: You have purchased the maximum number of servers");
        return;
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

            execHack(ns, hostname, hack_script, "home", true)
            ++i;
        }
        //Make the script wait for a second before looping again.
        //Removing this line will cause an infinite loop and crash the game.
        await ns.sleep(1000);
    }
}
