import { NS } from "@ns";
import { backdoorServers, waitForPID } from "./helpersScriptInterface";

export async function main(ns: NS): Promise<void> {

    const myMoney = ns.getPlayer().money
    if (!ns.hasTorRouter() && myMoney > 1000000) {
        ns.singularity.purchaseTor()
    }

    while (ns.getPlayer().skills.hacking < 10) {
        ns.singularity.universityCourse("Rothman University", "Computer Science", true)
        await ns.asleep(5000)
    }

    for (const server of backdoorServers) {
        if (!ns.getServer(server).backdoorInstalled) {
            const pid = ns.exec("backdoor.js", "home", 1, server)
            waitForPID(ns, pid, "home")
        }
    }
}
