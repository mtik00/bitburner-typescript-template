import { NS } from "@ns";
import { backdoorServers, waitForPID } from "./helpersScriptInterface";

export async function main(ns: NS): Promise<void> {
    const player = ns.getPlayer()
    const myMoney = player.money
    if (!ns.hasTorRouter() && myMoney > 1000000) {
        ns.singularity.purchaseTor()
    }

    while (ns.getPlayer().skills.hacking < 10) {
        ns.singularity.universityCourse("Rothman University", "Computer Science", true)
        await ns.asleep(5000)
    }

    for (const hostname of backdoorServers) {
        const server = ns.getServer(hostname)
        const hackDifficulty = server.hackDifficulty !== undefined ? server.hackDifficulty : 1E10
        const numOpenPortsRequired = server.numOpenPortsRequired !== undefined ? server.numOpenPortsRequired : 1E10
        const openPortCount = server.openPortCount !== undefined ? server.openPortCount : 1E10

        if (hackDifficulty <= player.skills.hacking && numOpenPortsRequired <= openPortCount) {
            const pid = ns.exec("backdoor.js", "home", 1, hostname)
            waitForPID(ns, pid, "home")
        }
    }
}
