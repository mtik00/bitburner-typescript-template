import { NS } from "@ns";

/**
 * 
 * @param ns 
 * @param all false: Only included rooted servers with money 
 * @returns string[] List of hostnames found
 */
export function scanAllServers(ns: NS, all = true): string[] {
    let returnHosts = [];
    let discoveredHosts = []; // Hosts (a.k.a. servers) we have scanned
    let hostsToScan = ["home"]; // Hosts we know about, but have no yet scanned
    let infiniteLoopProtection = 9999; // In case you mess with this code, this should save you from getting stuck
    while (hostsToScan.length > 0 && infiniteLoopProtection-- > 0) { // Loop until the list of hosts to scan is empty
        let hostName = hostsToScan.pop(); // Get the next host to be scanned

        if (typeof hostName !== "string") {
            continue
        }

        discoveredHosts.push(hostName); // Mark this host as "scanned"
        if (all || ns.hasRootAccess(hostName)) {
            returnHosts.push(hostName);
        }

        for (const connectedHost of ns.scan(hostName)) // "scan" (list all hosts connected to this one)
            if (!discoveredHosts.includes(connectedHost) && !hostsToScan.includes(connectedHost)) // If we haven't found this host
                hostsToScan.push(connectedHost); // Add it to the queue of hosts to be scanned
    }
    return returnHosts; // The list of scanned hosts should now be the set of all hosts in the game!
}
