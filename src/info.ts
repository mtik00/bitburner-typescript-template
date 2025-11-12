import { NS } from "@ns"
import { scanAllServers } from "/lib/scan"
import { PURCHASED_SERVER_HOSTNAME, SINGULARITY, HACK_PROGRAMS, UTILITY_PROGRAMS, MAX_HOME_RAM } from "/lib/const"
import { sortServers } from "/helpers"
import { nextPservUpgrade } from "/lib/purchasedServers"
import { getSwarm } from "/lib/swarm"
import { getUpgradeConfig } from "/lib/config"

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
    const upgradeConfig = getUpgradeConfig(ns)


    ns.tprintf("\n\n")
    ns.tprintf("************** Game Info ********************")

    // Next server to open
    const nextServer = next_server(ns)
    if (nextServer.hostname) {
        ns.tprintf("Next server to hack: %s @ %s", nextServer.hostname, nextServer.hackLevel)
    } else {
        ns.tprintf("🥳 All servers hacked!")
    }

    // Next upgrade to purchased $$
    const nextUpgrade = nextPservUpgrade(ns)
    if (!upgradeConfig.upgradePurchased) {
        ns.tprintf("WARN: purchased server upgrades are disabled")
    } else if (nextUpgrade.cost !== undefined) {
        ns.tprintf("Next purchased server upgrade: %s for $%s", ns.formatRam(nextUpgrade.ram), ns.formatNumber(nextUpgrade.cost, 2))
    } else {
        ns.tprintf("🥳 No more purchased server upgrades available!")
    }

    // Next upgrade to home $$
    if (SINGULARITY) {
        if (!upgradeConfig.upgradeHome) {
            ns.tprintf("WARN: home server upgrades are disabled")
        } else if (MAX_HOME_RAM !== undefined && ns.getServerMaxRam("home") < MAX_HOME_RAM) {
            const homeCost = ns.singularity.getUpgradeHomeRamCost()
            ns.tprintf("Next home RAM upgrade @ $%s", ns.formatNumber(homeCost, 2))
        } else {
            ns.tprintf("🥳 Home RAM already at %s!", ns.formatRam(MAX_HOME_RAM))
        }
    }

    // What's the next hack program we need to purchase
    let missingProgram
    for (const program of HACK_PROGRAMS) {
        if (!ns.fileExists(program)) {
            missingProgram = program
            break
        }
    }
    if (missingProgram === undefined) {
        ns.tprintf("🥳 No more programs to purchase!")
    } else {
        ns.tprintf("Next hack program to purchase: %s (brings ports to %i)", missingProgram, HACK_PROGRAMS.indexOf(missingProgram) + 1)
    }

    // What's the next utility program we need to purchase
    missingProgram = undefined
    for (const program of UTILITY_PROGRAMS.filter(p => p !== "Formulas.exe")) {
        if (!ns.fileExists(program)) {
            missingProgram = program
            break
        }
    }
    if (missingProgram === undefined) {
        ns.tprintf("🥳 No more utility programs to purchase!")
    } else {
        ns.tprintf("Next utility program to purchase: %s", missingProgram)
    }

    const augsNeeded = 31 - ns.singularity.getOwnedAugmentations().length
    if (augsNeeded <= 0) {
        ns.tprintf("🥳 You have enough augmentations to flee!")
    } else {
        ns.tprintf("You need %s more augmentations to flee", augsNeeded)
    }

    const f = ns.singularity.workForFaction

    // Who's getting hacked, and how many threads
    const status = hackStatus(ns)
    status.forEach((value, key) => {
        ns.tprintf("Hacking %s with %s threads", value.host, value.threads)
    })

    ns.tprintf("*********************************************")
    ns.tprintf("\n\n")
}
