import { NS, Server, ProcessInfo } from "@ns";
import { HOME_RAM_KEEP } from "./const";
import { runApps } from "./apps";
import { getThreads } from "/helpers";
import { getArgValue } from "/lib/autocomplete";
import { scanAllServers } from "/lib/scan";
import { isAHackingProcess } from "/lib/scripting";


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
        runApps(this.ns, this.hostname, this.server.numOpenPortsRequired || 99)
        this.server = this.ns.getServer(this.hostname)
    }

    getThreads(
        script: string,
        homeRamAdjust = HOME_RAM_KEEP, // Keep some RAM available on "home"
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

    public get hackScript(): string {
        if (this.procs.length === 0) {
            return ""
        }

        for (const proc of this.procs) {
            if (isAHackingProcess(proc)) {
                return proc.filename
            }
        }

        return ""
    }

    // This isn't quite right, but I need a larger refactor to account for
    // multiple targets/scripts/etc.
    // I'm currently assuming that this server will only target a single host,
    // with a single script, and there might be multiple processes.
    public get targetThreads(): number {
        if (this.procs.length === 0) {
            return 0
        }

        let threads = 0
        for (const proc of this.procs) {
            if (isAHackingProcess(proc)) {
                threads += proc.threads
            }
        }

        return threads
    }

    public get hack(): string {
        if (this.procs.length === 0) {
            return ""
        }

        for (const proc of this.procs) {
            if (isAHackingProcess(proc)) {
                return `${proc.filename}(${proc.threads})`
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
        // There's no need to list servers with 0 RAM in our "swarm"
        if (ns.getServerMaxRam(hostname) > 0)
            servers.push(new SwarmServer(ns, ns.getServer(hostname)))
    })

    return servers.sort((a, b) => (a.server.hackDifficulty || 0) - (b.server.hackDifficulty || 0))
}
