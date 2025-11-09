import { NS, Server } from "@ns";
import { getArgValue } from "./lib/autocomplete";
import { HOME_RAM_KEEP, PURCHASED_SERVER_HOSTNAME, DEBUG } from "./lib/const";
import { runApps } from "./lib/apps";
import { findPath } from "./lib/path";

/**
 * 
 * @param ns 
 * @param script Name of the script to use for the calculation
 * @param server The server that will run the script
 * @param homeRamAdjust Amount of RAM to hold back from "home"
 * @param maxRam Check the maximum RAM, not available
 * @returns integer
 */
export function getThreads(
    ns: NS,
    script: string,
    server: string,
    homeRamAdjust = HOME_RAM_KEEP, // Keep some RAM available on "home"
    maxRam = false,
): number {
    const scriptRam = ns.getScriptRam(script);
    let serverAvailableRam

    if (maxRam) {
        serverAvailableRam = ns.getServerMaxRam(server)
    } else {
        serverAvailableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
    }

    // Keep some RAM for home
    if (server == "home") {
        serverAvailableRam -= homeRamAdjust
        DEBUG && ns.tprintf("Home available RAM reduced to %s", ns.formatRam(serverAvailableRam))
    }

    const threads = Math.floor(serverAvailableRam / scriptRam);

    if (DEBUG) {
        ns.tprintf("scriptRam: %s", scriptRam);
        ns.tprintf("serverAvailableRam: %s", serverAvailableRam);
        ns.tprintf("threads: %s; for host: %s", threads, server);
    }

    return threads;
}

/**
 * Runs all available apps and tries to run NUKE.exe.
 * 
 * @param ns 
 * @param target The target server to open
 * @param force  Ignore invalid state
 * @returns 
 */
export function openServer(ns: NS, target: string, force: boolean = false, quiet = false): boolean {
    if ((target === "home") || target.startsWith(PURCHASED_SERVER_HOSTNAME)) {
        return true;
    }

    // NOTE: You have to run the apps to open ports before you run NUKE.exe
    const requiredPorts = ns.getServerNumPortsRequired(target);
    const portCount = runApps(ns, target, requiredPorts);

    if ((requiredPorts > portCount) && !force) {
        !quiet && ns.tprintf("Not enough apps (%i) for: %s; need %i", portCount, target, requiredPorts);
        return false;
    }

    try {
        ns.nuke(target);
    } catch (error) {
        !quiet && ns.tprintf("Can't nuke %s: %s", target, error);
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
    quiet = true,
) {

    const nquiet = !quiet
    if (target === "home" || target.startsWith(PURCHASED_SERVER_HOSTNAME)) {
        return
    }

    const hostServer = host === '' ? target : host

    if (ns.getServerMaxRam(hostServer) === 0) {
        return
    }

    const myHackingLevel = ns.getHackingLevel()
    const targetHackingLevel = ns.getServerRequiredHackingLevel(target)
    const hostHackingLevel = ns.getServerRequiredHackingLevel(hostServer)

    if (targetHackingLevel > myHackingLevel) {
        nquiet && ns.tprintf("WARN: Insufficient hacking skill for %s; need: %s", target, targetHackingLevel);
        return;
    } else if (hostHackingLevel > myHackingLevel) {
        nquiet && ns.tprintf("WARN: Insufficient hacking skill for %s; need: %s", hostServer, hostHackingLevel);
        return;
    }

    if (!openServer(ns, target, force, quiet)) {
        return;
    } else if (!openServer(ns, hostServer, force, quiet)) {
        return;
    }

    const threads = getThreads(ns, script, hostServer)

    if (threads < 1) {
        nquiet && ns.tprintf("Not enough RAM left on %s to run %s", hostServer, script);
    } else {
        ns.tprintf("---- Executing hack on %s from %s", target, hostServer);
        ns.scp(script, hostServer);

        const moneyThresh = ns.getServerMaxMoney(target) * serverMoneyThresholdFactor
        const securityThresh = ns.getServerMinSecurityLevel(target) + securityThreshAdjust

        ns.exec(script, hostServer, threads, "--target", target, "--moneyThresh", moneyThresh, "--securityThresh", securityThresh);
        ns.tprintf("executed %s on %s with -t=%s", script, hostServer, threads);
    }
}

/**
 * Take a list of hostnames and sort them by the input key.
 * 
 * @param ns NS
 * @param key The key of the `Server` to sort by
 * @param hostnames A list of server hostname
 * @param order asc/desc
 * @returns string[] : The list of hostnames sorted by the inputs
 */
export function sortServers(ns: NS, key: keyof Server, hostnames: string[], order: 'asc' | 'desc' = 'asc'): string[] {

    let servers: Server[] = []

    for (const hostname of hostnames) {
        servers.push(ns.getServer(hostname))
    }

    const sortedServers = [...servers].sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return order === 'asc' ? 1 : -1;
        if (bValue == null) return order === 'asc' ? -1 : 1;

        // Compare values
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
    });

    return sortedServers.map(server => server.hostname);
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

export function connectCommand(
    ns: NS,
    target: string,
    startServer: string = "home",
): string {
    if (target === undefined) {
        ns.alert('Please provide target server');
        return '';
    }
    let [results, isFound] = findPath(ns, target.toString(), startServer, [], [], false);
    let connectString = ''

    if (!isFound) {
        ns.alert('Server not found!');
    } else {
        for (const host in results) {
            connectString += ns.sprintf("connect %s;", results[host])
        }
    }

    return connectString
}

export function findHackPID(ns: NS, hostServer: string, scriptMatch: RegExp = /.*hack.js/): number {
    const processes = ns.ps(hostServer)
    let hackPID = 0

    for (let index = 0; index < processes.length; index++) {
        const process = processes[index];
        ns.tprint(process)
        if (process.filename.match(scriptMatch)) {
            hackPID = process.pid
            break
        }
    }

    return hackPID
}

export async function main(ns: NS) {
    ns.tprint(getThreads(ns, "v1-hack.js", "home"))
}


export function getProcessInfo(ns: NS, host: string): string {
    /*
    Gets the first action in the list and returns it.
    */
    var actions = ns.ps(host)
    if (actions.length == 0) {
        return ""
    }
    const filename = actions[0].filename.replace("scripts/", "").replace(".js", "")
    const target = getArgValue(actions[0].args, "--target")
    return `${filename}(${target === undefined ? '??' : target})`
}
