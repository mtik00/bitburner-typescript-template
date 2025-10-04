// @ts-nocheck
import { NS } from "@ns";
import { getThreads } from './helpers.js'

export async function main(ns: NS) {
    const options = ns.flags([
        ['script', 'v1-hack.js'],
        ['ram', 8]
    ]);

    const ram = options.ram;
    const hack_script = options.script;
    const serverLimit = ns.getPurchasedServerLimit();
    const purchasedServers = ns.getPurchasedServers();

    if (purchasedServers.length >= serverLimit) {
        ns.tprintf("ERROR: You have purchased the maximum number of servers");
        return;
    }

    ns.printf("Purchasing up to %i servers with %iGB RAM", serverLimit, ram);

    let i = 0;

    // Continuously try to purchase servers until we've reached the maximum
    // amount of servers
    while (i < serverLimit) {
        // Check if we have enough money to purchase a server
        if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
            // If we have enough money, then:
            //  1. Purchase the server
            //  2. Copy our hacking script onto the newly-purchased server
            //  3. Run our hacking script on the newly-purchased server with 3 threads
            //  4. Increment our iterator to indicate that we've bought a new server
            let svr_name = ns.sprintf("pserv-%03i", i + 1);
            let hostname = ns.purchaseServer(svr_name, ram);
            let threads = getThreads(ns, hack_script, hostname);

            ns.printf("hacking %s with %s and %i threads", hostname, hack_script, threads);
            ns.scp(hack_script, hostname);
            ns.exec(hack_script, hostname, threads);
            ++i;
        }
        //Make the script wait for a second before looping again.
        //Removing this line will cause an infinite loop and crash the game.
        await ns.sleep(1000);
    }
}
