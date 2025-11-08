import { NS } from "@ns"
import { scanAllServers } from "/lib/scan"
import { PURCHASED_SERVER_HOSTNAME, SINGULARITY } from "/lib/const"
import { sortServers } from "/helpers"
import { nextPservUpgrade } from "/lib/purchasedServers"
import { getSwarm } from "/lib/swarm"

function next_server(ns: NS) {
    // We need to get all hostnames since `scanAllServers` isn't sorted yet.
    let hostnames: string[] = []
    for (const hostname of scanAllServers(ns, true)) {
        if (hostname == "home" || hostname.startsWith(PURCHASED_SERVER_HOSTNAME)) {
            continue
        }

        const need = ns.getServerRequiredHackingLevel(hostname)
        if (need >= ns.getHackingLevel() && !ns.hasRootAccess(hostname)) {
            hostnames.push(hostname)
        }
    }

    if (hostnames.length === 0) {
        return {
            hostname: null,
            hackLevel: null,
        }
    }

    const servers = sortServers(ns, "requiredHackingSkill", hostnames)
    return {
        hostname: servers[0],
        hackLevel: ns.getServerRequiredHackingLevel(servers[0])
    }
}

interface HackStatus {
    host: string
    target: string
    threads: number
    script: string
}

interface HackTarget {
    host: string
    threads: number
}

function hackStatus(ns: NS): Map<string, HackTarget> {
    let status: HackStatus[] = []
    for (const server of getSwarm(ns)) {
        status.push({
            host: server.hostname,
            target: server.target,
            threads: server.targetThreads,
            script: server.hackScript,
        } as HackStatus)
    }

    // Summarize all of the stats.  We're only concerned with targets and number
    // of threads.
    let result = new Map<string, HackTarget>();
    for (const item of status) {
        if (item.threads === 0) {
            continue
        }

        let current = result.get(item.target)
        if (current === undefined) {
            result.set(item.target, { host: item.target, threads: item.threads } as HackTarget)
        } else {
            let currentThreads = current.threads || 0
            currentThreads += item.threads
            result.set(item.target, { host: item.target, threads: currentThreads } as HackTarget)
        }
    }

    return result
}

export async function main(ns: NS): Promise<void> {
    ns.tprintf("\n\n")
    ns.tprintf("************** Game Info ********************")

    // Next server to open
    const nextServer = next_server(ns)
    if (nextServer.hostname) {
        ns.tprintf("Next server to hack: %s @ %s", nextServer.hostname, nextServer.hackLevel)
    } else {
        ns.tprintf("🥳 All servers hacked")
    }

    // Next upgrade to purchased $$
    const nextUpgrade = nextPservUpgrade(ns)
    if (nextUpgrade.cost !== undefined) {
        ns.tprintf("Next purchased server upgrade: %s for $%s", ns.formatRam(nextUpgrade.ram), ns.formatNumber(nextUpgrade.cost, 2))
    } else {
        ns.tprintf("🥳 No more purchased server upgrades available")
    }

    // Next upgrade to home $$
    if (SINGULARITY) {
        const homeCost = ns.singularity.getUpgradeHomeRamCost()
        ns.tprintf("Next home RAM upgrade @ $%s", ns.formatNumber(homeCost, 2))
    }

    // Who's getting hacked, and how many threads
    const status = hackStatus(ns)
    status.forEach((value, key) => {
        ns.tprintf("Hacking %s with %s threads", value.host, value.threads)
    })
    ns.tprintf("*********************************************")
    ns.tprintf("\n\n")
}
