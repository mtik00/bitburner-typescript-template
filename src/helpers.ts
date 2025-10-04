import { NS } from "@ns";

export function getThreads(ns: NS, script: string, server: string, script_host = "home") {
    const scriptRam = ns.getScriptRam(script, script_host);
    let serverAvailableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

    // Keep 8GB of RAM for home
    if (server == "home") {
        serverAvailableRam -= 8;
    }

    const threads = Math.floor(serverAvailableRam / scriptRam);

    // ns.tprintf("scriptRam: %s", scriptRam);
    // ns.tprintf("serverAvailableRam: %s", serverAvailableRam);
    // ns.tprintf("threads: %s; for host: %s", threads, server);

    return threads;
}

export function getConnectedServers(ns: NS, server: string, ignore = "home") {
    var servers: string[] = [];
    var cur = ns.scan(server);
    cur.forEach(new_server => {
        if (new_server !== ignore && new_server !== server) {
            ns.tprintf("found server: %s on %s", new_server, server);
            servers.push(new_server);
        }
    });

    return servers;
}

export function runApps(ns: NS, target: string) {
    if (target == "home") {
        return 99;
    }

    let portCount = 0;
    if (ns.fileExists("BruteSSH.exe")) {
        ns.brutessh(target);
        portCount++;
    }

    if (ns.fileExists("FTPCrack.exe")) {
        ns.ftpcrack(target);
        portCount++;
    }

    if (ns.fileExists("relaySMTP.exe")) {
        ns.relaysmtp(target);
        portCount++;
    }

    if (ns.fileExists("HTTPWorm.exe")) {
        ns.httpworm(target);
        portCount++;
    }

    if (ns.fileExists("SQLInject.exe")) {
        ns.sqlinject(target);
        portCount++;
    }

    return portCount;
}

export function openServer(ns: NS, server: string, force: boolean = false) {
    if ((server === "home") || server.startsWith("pserv")) {
        return true;
    }

    // NOTE: You have to run the apps to open ports before you run NUKE.exe
    const portCount = runApps(ns, server);
    const requiredPorts = ns.getServerNumPortsRequired(server);

    if (requiredPorts > portCount && !force) {
        ns.tprintf("Not enough apps (%i) for: %s; need %i", portCount, server, requiredPorts);
        return false;
    }

    try {
        ns.nuke(server);
    } catch (error) {
        ns.tprintf("Can't nuke %s: %s", server, error);
        if (!force) {
            return false;
        }
    }

    return true;
}

export function execHack(ns: NS, server: string, script: string, script_host = "home", force = false) {

    const needLevel = ns.getServerRequiredHackingLevel(server);
    if (needLevel > ns.getHackingLevel()) {
        ns.tprintf("WARN: Insufficient hacking skill for %s; need: %s", server, needLevel);
        return;
    }

    if (!openServer(ns, server, force)) {
        return;
    }

    const threads = getThreads(ns, script, server, script_host);

    if (threads < 1) {
        ns.tprintf("Not enough RAM left on %s to run %s", server, script);
    } else {
        ns.tprintf("---- Executing hack on %s", server);
        ns.scp(script, server);
        ns.exec(script, server, threads);
        ns.tprintf("executed %s on %s with -t=%s", script, server, threads);
    }
}

/** Helper to get a list of all hostnames on the network
 * @param {NS} ns The nestcript instance passed to your script's main entry point
 * @param {boolean} all True: return all servers found; False: only returned rooted servers w/ money
 * @returns {string[]} **/
export function scanAllServers(ns: NS, all = true) {
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
        if (all || (ns.hasRootAccess(hostName) && (ns.getServerMaxMoney(hostName) > 0))) {
            returnHosts.push(hostName);
        }
        for (const connectedHost of ns.scan(hostName)) // "scan" (list all hosts connected to this one)
            if (!discoveredHosts.includes(connectedHost) && !hostsToScan.includes(connectedHost)) // If we haven't found this host
                hostsToScan.push(connectedHost); // Add it to the queue of hosts to be scanned
    }
    return returnHosts; // The list of scanned hosts should now be the set of all hosts in the game!
}

export function assertType(value: any, type: string) {
    if (typeof value !== type) {
        throw new Error("Value must be a " + type);
    }
}

export async function main(ns: NS) {
    getThreads(ns, "v1-hack.js", "home")
}
