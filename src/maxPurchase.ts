import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {

    const myMoney = ns.getServerMoneyAvailable("home")

    const maxRam = Math.pow(2, 20) // 1048576
    let ram = 1024
    let totalUpgradeCost = ns.getPurchasedServerUpgradeCost("pserv-001", ram) * 25.0

    while (totalUpgradeCost < myMoney) {
        if (ram > maxRam || totalUpgradeCost > myMoney) {
            ram /= 2
            break
        }

        ram *= 2
        totalUpgradeCost = ns.getPurchasedServerUpgradeCost("pserv-001", ram) * 25.0
    }

    if (totalUpgradeCost > myMoney) {
        ns.tprintf("ERROR: You would need %s to upgrade all servers to %i", ns.formatNumber(totalUpgradeCost), ram)
    } else {
        ns.tprintf("can upgrade all servers to: %i for %s", ram, ns.formatNumber(totalUpgradeCost))
    }
}
