import { NS } from "@ns";
import { openServer, sortServers } from "./helpers";
import { waitForPIDComplete } from "/lib/scripting";
import { backdoorServers } from "/lib/const";
import { scanAllServers } from "/lib/scan";
import { appCount } from "/lib/apps";
import { PROGRAMS, SAFE_FACTIONS } from "/lib/const";
import { upgradePurchasedServers } from "/lib/purchasedServers";
/**
 * TODO:
 * - Study compsci until 20, then Rob Store until?
 */

/**
 * Auto-accept invites from factions that are not at work
 * @param ns 
 */
function acceptInvitations(ns: NS) {
    for (const faction of ns.singularity.checkFactionInvitations()) {
        if (SAFE_FACTIONS.includes(faction)) {
            ns.singularity.joinFaction(faction)
        }
    }
}

function studyingCompSci(ns: NS): boolean {
    const currentWork = ns.singularity.getCurrentWork();
    return currentWork?.type === "CLASS" && currentWork.classType === "Computer Science"
}

function purchasePrograms(ns: NS) {
    if (!ns.hasTorRouter()) {
        return
    }

    const money = ns.getPlayer().money

    // I currently don't care about Formulas.exe, and it's really expensive
    // early game.
    for (const program of PROGRAMS.filter(p => p !== "Formulas.exe")) {
        if (ns.fileExists(program)) {
            continue
        }

        const cost = ns.singularity.getDarkwebProgramCost(program)

        if (cost <= money) {
            const success = ns.singularity.purchaseProgram(program);
            if (!success) {
                ns.tprint(`ERROR: Failed to purchase ${program}`)
            } else {
                ns.tprint(`Purchased ${program}`)
            }
        } else {
            // Don't waste money on cheaper things; wait for the hacks.
            ns.print(`Need $${ns.formatNumber(cost, 2)} to purchase ${program}`)
            break
        }
    }
}

async function initialStudy(ns: NS, maxSkill = 10) {
    let initialStudy = false
    while (ns.getPlayer().skills.hacking < maxSkill) {
        initialStudy = true
        ns.print("studying Computer Science")

        if (ns.getPlayer().city != "Sector-12") {
            ns.singularity.travelToCity("Sector-12")
        }

        if (!studyingCompSci(ns)) {
            ns.singularity.universityCourse("Rothman University", "Computer Science", true);
        }

        await ns.asleep(5000)
    }

    // Keep studying, but put it in the background so it's obvious we're done.
    if (initialStudy && studyingCompSci(ns)) {
        ns.singularity.stopAction()
        await ns.asleep(500)
        ns.singularity.universityCourse("Rothman University", "Computer Science", false)
    }
}

function hackNewServers(ns: NS) {
    // Look for new servers to hack
    // Make sure the target is open before we start to hack it.
    const hostnames = sortServers(ns, "requiredHackingSkill", scanAllServers(ns));
    const myLevel = ns.getHackingLevel()
    const myApps = appCount(ns)

    for (const hostname of hostnames) {
        const server = ns.getServer(hostname)
        const openPortCount = server.openPortCount || 0
        const numOpenPortsRequired = server.numOpenPortsRequired || 0
        if (ns.getServerRequiredHackingLevel(hostname) > myLevel) {
            break
        } else if (server.hasAdminRights) {
            continue
        }

        if (openPortCount < numOpenPortsRequired && numOpenPortsRequired <= myApps) {
            // Only nuke it if we opened it
            if (openServer(ns, hostname, undefined, true)) {
                ns.nuke(hostname)
                ns.print(`Acquired new server: ${hostname}`)
            }
        }
    }
}

async function backdoorNewServers(ns: NS) {

    const needRAM = ns.getScriptRam("backdoor.js", "home")
    const freeFram = ns.getServerMaxRam("home") - ns.getServerUsedRam("home")
    if (needRAM > freeFram) {
        ns.print("WARN: Not enough free RAM to run backdoor.js; run it manually with 'all'")
        return
    }

    const player = ns.getPlayer()
    const myAppCount = appCount(ns)

    for (const hostname of backdoorServers) {
        const server = ns.getServer(hostname)

        if (server === undefined) {
            ns.print(`Could not get server: ${hostname}`)
            continue
        } else if (server.backdoorInstalled) {
            ns.print(`backoor already installed on ${hostname}`)
            continue
        }

        const hackDifficulty = ns.getServerRequiredHackingLevel(hostname)
        const numOpenPortsRequired = server.numOpenPortsRequired !== undefined ? server.numOpenPortsRequired : 1E10

        if (ns.getHackingLevel() < hackDifficulty) {
            ns.print(`can't hack ${hostname} yet.  Have ${player.skills.hacking}, need ${hackDifficulty}`)
            continue
        } else if (numOpenPortsRequired > myAppCount) {
            ns.print(`can't hack ${hostname} yet.  Only have ${myAppCount} ports I can open, need ${numOpenPortsRequired}`)
            continue
        }

        if (openServer(ns, hostname, undefined, true)) {
            ns.nuke(hostname)

            ns.print(`running backdoor on ${hostname}`)
            const pid = ns.exec("backdoor.js", "home", undefined, hostname)
            if (pid === 0) {
                ns.tprintf("WARN: Could not run backdoor.js on %s", hostname)
            } else {
                ns.tprintf("pid of backdoor script: %s", pid)
                await waitForPIDComplete(ns, pid, "home")
                ns.print(`...done with ${hostname}`)
            }
        }
    }
}

function upgradeHomeServer(ns: NS) {
    let currentRam = ns.getServerMaxRam("home")
    const cost = ns.singularity.getUpgradeHomeRamCost()

    if (ns.getPlayer().money > cost) {
        ns.singularity.upgradeHomeRam()
        currentRam = ns.getServerMaxRam("home")
        ns.tprintf("home upgraded to %s", ns.formatRam(currentRam))
    }
}

function purchaseTorRouter(ns: NS) {
    if (ns.getPlayer().money > 300000) {
        const success = ns.singularity.purchaseTor()
        if (!success) {
            ns.tprint(`ERROR: Failed to purchase TOR`)
        } else {
            ns.tprint(`Purchased TOR`)
        }
    }
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL")
    // ns.ui.openTail()
    ns.print("#### singularityStartup")


    !ns.hasTorRouter() && purchaseTorRouter(ns)
    ns.hasTorRouter() && purchasePrograms(ns)

    const player = ns.getPlayer()
    if (player.skills.hacking < 10) {
        await initialStudy(ns, 10)
    }

    // Prioritize upgrading our purchased servers over home
    upgradePurchasedServers(ns)
    upgradeHomeServer(ns)

    hackNewServers(ns)
    await backdoorNewServers(ns)
    acceptInvitations(ns)

    ns.print("...startup complete")
}
