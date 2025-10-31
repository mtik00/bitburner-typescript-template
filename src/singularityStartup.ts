import { NS } from "@ns";
import { openServer } from "./helpers";
import { backdoorServers, waitForPID } from "./helpersScriptInterface";

const programs = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
    "ServerProfiler.exe",
    "DeepscanV1.exe",
    "DeepscanV2.exe",
    "AutoLink.exe",
    // "Formulas.exe",
]

function studyingCompSci(ns: NS): boolean {
    const currentWork = ns.singularity.getCurrentWork();
    return currentWork?.type === "CLASS" && currentWork.classType === "Computer Science"
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

    if (ns.hasTorRouter()) {
        for (const program of programs) {
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
                ns.tprint(`Need $${ns.formatNumber(cost, 2)} to purchase ${program}`)
                break
            }
        }
    }

    let initialStudy = false
    while (ns.getPlayer().skills.hacking < 10) {
        initialStudy = true
        ns.print("studying Computer Science")

        if (ns.getPlayer().city != "Sector-12") {
            ns.singularity.travelToCity("Sector-12")
        }

        const currentWork = ns.singularity.getCurrentWork();

        if (!studyingCompSci(ns)) {
            ns.singularity.universityCourse("Rothman University", "Computer Science", true);
        }

        await ns.asleep(5000)
    }

    // Keep studying, but put it in the background so it's obvious we're done.
    if (initialStudy && studyingCompSci(ns)) {
        ns.singularity.stopAction()
        ns.singularity.universityCourse("Rothman University", "Computer Science", false)
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

        openServer(ns, hostname)
        ns.nuke(hostname)

        ns.print(`running backdoor on ${hostname}`)
        const pid = ns.exec("backdoor.js", "home", 1, hostname)
        waitForPID(ns, pid, "home")
        ns.print(`...done with ${hostname}`)
    }

    ns.print("...startup complete")
}
