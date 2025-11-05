import { NS } from "@ns";
import { openServer, sortServers } from "./helpers";
import { waitForPIDComplete } from "./lib/scripting";
import { backdoorServers } from "./lib/const";
import { scanAllServers } from "./lib/scan";
import { appCount } from "./lib/apps";
import { PROGRAMS } from "./lib/const";


function studyingCompSci(ns: NS): boolean {
    const currentWork = ns.singularity.getCurrentWork();
    return currentWork?.type === "CLASS" && currentWork.classType === "Computer Science"
}

function purchasePrograms(ns: NS) {
    if (!ns.hasTorRouter()) {
        return
    }

    // I currently don't care about Formulas.exe, and it's really expensive
    // early game.
    for (const program of PROGRAMS.filter(p => p !== "Formulas.exe")) {
        if (ns.fileExists(program)) {
            continue
        }

        const cost = ns.singularity.getDarkwebProgramCost(program)

        if (cost <= ns.getPlayer().money) {
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

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL")
    // ns.ui.openTail()
    ns.print("#### singularityStartup")

    const player = ns.getPlayer()
    const myMoney = player.money
    if (!ns.hasTorRouter() && myMoney > 1000000) {
        const success = ns.singularity.purchaseTor()
        if (!success) {
            ns.tprint(`ERROR: Failed to purchase TOR`)
        } else {
            ns.tprint(`Purchased TOR`)
        }
    }

    ns.hasTorRouter() && purchasePrograms(ns)

    let initialStudy = false
    while (ns.getPlayer().skills.hacking < 10) {
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
        const openPortCount = server.openPortCount !== undefined ? server.openPortCount : 1E10

        if (ns.getHackingLevel() < hackDifficulty) {
            ns.print(`can't hack ${hostname} yet.  Have ${player.skills.hacking}, need ${hackDifficulty}`)
            continue
        } else if (numOpenPortsRequired < openPortCount) {
            ns.print(`can't hack ${hostname} yet.  Have ${openPortCount} ports opened, need ${numOpenPortsRequired}`)
            continue
        }

        if (openServer(ns, hostname, undefined, true)) {
            ns.nuke(hostname)

            ns.print(`running backdoor on ${hostname}`)
            const pid = ns.exec("backdoor.js", "home", { preventDuplicates: true }, hostname)
            await waitForPIDComplete(ns, pid, "home")
            ns.print(`...done with ${hostname}`)
        }
    }

    ns.print("...startup complete")
}
