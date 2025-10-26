import { NS, Server, ProcessInfo, ScriptArg } from "@ns";

export const RAM = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]

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
    homeRamAdjust = 16, // Keep some RAM available on "home"
    maxRam = false,
): number {
    const scriptRam = ns.getScriptRam(script);
    let serverAvailableRam

    if (maxRam) {
        serverAvailableRam = ns.getServerMaxRam(server)
    } else {
        serverAvailableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
    }

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
    quiet = true,
) {

    if (target === "home" || target.startsWith("pserv")) {
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
        !quiet && ns.tprintf("Not enough RAM left on %s to run %s", hostServer, script);
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
        if (all || ns.hasRootAccess(hostName)) {
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

export class SwarmServer {
    ns: NS
    server: Server
    procs: ProcessInfo[]

    constructor(ns: NS, server: any) {
        this.ns = ns
        this.server = server
        this.procs = ns.ps(server.hostname)
    }

    public get hostname(): string {
        return this.server.hostname
    }

    public get maxRam(): number {
        return this.server.maxRam
    }

    public get availableRam(): number {
        return this.server.maxRam - this.server.ramUsed
    }

    public get ports_required(): number {
        return this.server.numOpenPortsRequired || 99
    }

    public get ports_open(): number {
        return this.server.openPortCount || 0
    }

    nuke() {
        runApps(this.ns, this.hostname)
        this.server = this.ns.getServer(this.hostname)
    }

    getThreads(
        script: string,
        homeRamAdjust = 16, // Keep some RAM available on "home"
        maxRam = false,
    ): number {
        return getThreads(this.ns, script, this.hostname, homeRamAdjust, maxRam)
    }

    public get target(): string {
        if (this.procs.length === 0) {
            return ""
        }

        const t = getArgValue(this.procs[0].args, "--target")
        if (t === undefined) {
            return "?"
        }

        return t.toString()
    }

    public get hack(): string {
        if (this.procs.length === 0) {
            return ""
        }

        for (const proc of this.procs) {
            if (proc.filename.includes("h")) {
                return proc.filename
            }
        }
        return "?"
    }
}

/**
 * Returns a list of our swarm (servers of which we have root access.
 * 
 * @param ns NS
 * @returns SwarmServer[]
 */
export function getSwarm(ns: NS): SwarmServer[] {
    let servers: SwarmServer[] = []

    scanAllServers(ns, false).forEach((hostname) => {
        servers.push(new SwarmServer(ns, ns.getServer(hostname)))
    })

    return servers.sort((a, b) => (a.server.hackDifficulty || 0) - (b.server.hackDifficulty || 0))
}

/**
 * 
 * @param args List of process args
 * @param flag Flag to search for
 * @returns 
 */
export function getArgValue(args: ScriptArg[], flag: string): ScriptArg | undefined {
    const flagIndex = args.indexOf(flag);
    if (flagIndex !== -1 && flagIndex < args.length - 1) {
        return args[flagIndex + 1];
    }
    return undefined;
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

export function createFlagAutocomplete(flagConfig: Record<string, any>) {
    return function (data: any, args: any) {
        const lastArg = args[args.length - 1];
        const previousArg = args.length > 1 ? args[args.length - 2] : null;

        // Check each flag in the config
        for (const [flag, values] of Object.entries(flagConfig)) {
            if (lastArg === flag || previousArg === flag) {
                // If values is a function, call it with data
                return typeof values === 'function' ? values(data) : values;
            }
        }

        // Return list of available flags
        return Object.keys(flagConfig);
    };
}

export function filterHackableServers(data: any): string[] {
    return data.servers.filter((s: string) => s !== "home" && !s.startsWith("pserv"));
}

export function getServerFromStockSymbol(symbol: string): string {
    const symServer: Record<string, string> = {
        "WDS": "",
        "ECP": "ecorp",
        "MGCP": "megacorp",
        "BLD": "blade",
        "CLRK": "clarkinc",
        "OMTK": "omnitek",
        "FSIG": "4sigma",
        "KGI": "kuai-gong",
        "DCOMM": "defcomm",
        "VITA": "vitalife",
        "ICRS": "icarus",
        "UNV": "univ-energy",
        "AERO": "aerocorp",
        "SLRS": "solaris",
        "GPH": "global-pharm",
        "NVMD": "nova-med",
        "LXO": "lexo-corp",
        "RHOC": "rho-construction",
        "APHE": "alpha-ent",
        "SYSC": "syscore",
        "CTK": "comptek",
        "NTLK": "netlink",
        "OMGA": "omega-net",
        "JGN": "joesguns",
        "SGC": "sigma-cosmetics",
        "CTYS": "catalyst",
        "MDYN": "microdyne",
        "TITN": "titan-labs",
        "FLCM": "fulcrumtech",
        "STM": "stormtech",
        "HLS": "helios",
        "OMN": "omnia",
        "FNS": "foodnstuff"
    }

    return symServer[symbol];
}
