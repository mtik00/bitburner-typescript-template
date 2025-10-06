import { NS } from "@ns";

/**
 * 
 * @param ns 
 * @param script Name of the script to use for the calculation
 * @param server The server that will run the script
 * @param homeRamAdjust Amount of RAM to hold back from "home"
 * @returns integer
 */
export function getThreads(
    ns: NS,
    script: string,
    server: string,
    homeRamAdjust = 16, // Keep some RAM available on "home"
): number {
    const scriptRam = ns.getScriptRam(script);
    let serverAvailableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

    // Keep 8GB of RAM for home
    if (server == "home") {
        serverAvailableRam -= homeRamAdjust
    }

    const threads = Math.floor(serverAvailableRam / scriptRam);

    // ns.tprintf("scriptRam: %s", scriptRam);
    // ns.tprintf("serverAvailableRam: %s", serverAvailableRam);
    // ns.tprintf("threads: %s; for host: %s", threads, server);

    return threads;
}

/**
 * 
 * @param ns 
 * @param target The target server to run the apps
 * @returns integer: Numbe of apps ran
 */
export function runApps(ns: NS, target: string): number {
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

/**
 * Runs all available apps and tries to run NUKE.exe.
 * 
 * @param ns 
 * @param target The target server to open
 * @param force  Ignore invalid state
 * @returns 
 */
export function openServer(ns: NS, target: string, force: boolean = false) {
    if ((target === "home") || target.startsWith("pserv")) {
        return true;
    }

    // NOTE: You have to run the apps to open ports before you run NUKE.exe
    const portCount = runApps(ns, target);
    const requiredPorts = ns.getServerNumPortsRequired(target);

    if ((requiredPorts > portCount) && !force) {
        ns.tprintf("Not enough apps (%i) for: %s; need %i", portCount, target, requiredPorts);
        return false;
    }

    try {
        ns.nuke(target);
    } catch (error) {
        ns.tprintf("Can't nuke %s: %s", target, error);
        if (!force) {
            return false;
        }
    }

    return true;
}

/**
 * 
 * Execute a hack against a target
 * 
 * @param ns 
 * @param target The target of the hack
 * @param script The script used for hacking
 * @param force  Ignore invalid state and try the hack anyway
 * @param host The serve on which to run the script
 * @param serverMoneyThresholdFactor # Factor to reduce a target's max money
 * @param securityThreshAdjust # Adjust the targets security threshold
 * @returns 
 */
export function execHack(
    ns: NS,
    target: string,
    script: string,
    force = false,
    host = '',
    serverMoneyThresholdFactor = 0.75,
    securityThreshAdjust = 5,
) {

    if (target === "home" || target.startsWith("pserv")) {
        return
    }

    const hostServer = host === '' ? target : host

    const myHackingLevel = ns.getHackingLevel()
    const targetHackingLevel = ns.getServerRequiredHackingLevel(target)
    const hostHackingLevel = ns.getServerRequiredHackingLevel(hostServer)

    if (targetHackingLevel > myHackingLevel) {
        ns.tprintf("WARN: Insufficient hacking skill for %s; need: %s", target, targetHackingLevel);
        return;
    } else if (hostHackingLevel > myHackingLevel) {
        ns.tprintf("WARN: Insufficient hacking skill for %s; need: %s", hostServer, hostHackingLevel);
        return;
    }

    if (!openServer(ns, target, force)) {
        return;
    } else if (!openServer(ns, hostServer, force)) {
        return;
    }

    const threads = getThreads(ns, script, hostServer)

    if (threads < 1) {
        ns.tprintf("Not enough RAM left on %s to run %s", hostServer, script);
    } else {
        ns.tprintf("---- Executing hack on %s from %s", target, hostServer);
        ns.scp(script, hostServer);

        const moneyThresh = ns.getServerMaxMoney(target) * serverMoneyThresholdFactor
        const securityThresh = ns.getServerMinSecurityLevel(target) + securityThreshAdjust

        ns.exec(script, hostServer, threads, "--target", target, "--moneyThresh", moneyThresh, "--securityThresh", securityThresh);
        ns.tprintf("executed %s on %s with -t=%s", script, hostServer, threads);
    }
}

/** Helper to get a list of all hostnames on the network **/

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
        if (all || (ns.hasRootAccess(hostName) && (ns.getServerMaxMoney(hostName) > 0))) {
            returnHosts.push(hostName);
        }
        for (const connectedHost of ns.scan(hostName)) // "scan" (list all hosts connected to this one)
            if (!discoveredHosts.includes(connectedHost) && !hostsToScan.includes(connectedHost)) // If we haven't found this host
                hostsToScan.push(connectedHost); // Add it to the queue of hosts to be scanned
    }
    return returnHosts; // The list of scanned hosts should now be the set of all hosts in the game!
}

/**
 * 
 * Gets the first action and args in the process list and returns it as a string.
 * 
 * @param ns 
 * @param host 
 * @returns string
 */
export function getServerAction(ns: NS, host: string): string {
    /*
    Gets the first action in the list and returns it.
    */
    var actions = ns.ps(host)

    if (actions.length == 0) {
        return ""
    }

    return ns.sprintf("%s %s", actions[0].filename, actions[0].args.join(" "))
}

export function findPath(
    ns: NS,
    target: string,
    serverName: string,
    serverList: string[],
    ignore: string[],
    isFound: boolean,
): [string[], boolean] {
    ignore.push(serverName);
    let scanResults = ns.scan(serverName);
    for (let server of scanResults) {
        if (ignore.includes(server)) {
            continue;
        }
        if (server === target) {
            serverList.push(server);
            return [serverList, true];
        }
        serverList.push(server);
        [serverList, isFound] = findPath(ns, target, server, serverList, ignore, isFound);
        if (isFound) {
            return [serverList, isFound];
        }
        serverList.pop();
    }
    return [serverList, false];
}

export async function main(ns: NS) {
    ns.tprint(getThreads(ns, "v1-hack.js", "home"))
}
