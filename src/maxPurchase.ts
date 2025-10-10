import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {

    const myMoney = ns.getServerMoneyAvailable("home")

    const maxRam = Math.pow(2, 20) // 1048576
    ns.tprintf("Maximum RAM available: %s", ns.formatRam(maxRam))
    var ram = 8
    var totalUpgradeCost = ns.getPurchasedServerUpgradeCost("pserv-001", ram) * 25.0

    let index = 0
    while (totalUpgradeCost < myMoney && (ram <= maxRam) && isFinite(totalUpgradeCost)) {
        // ns.tprintf("step: %i; cost: %s; ram: %s", index, ns.formatNumber(totalUpgradeCost), ns.formatRam(ram))
        if ((totalUpgradeCost > myMoney)) {
            break
        }

        index += 1
        ram *= 2
        totalUpgradeCost = ns.getPurchasedServerUpgradeCost("pserv-001", ram) * 25.0
        // if (!isFinite(totalUpgradeCost)) {
        //     ns.tprint("here")
        //     ram /= 2
        //     totalUpgradeCost = ns.getPurchasedServerUpgradeCost("pserv-001", ram) * 25.0
        //     break

        if (index > 30) {
            break
        }
    }

    // ns.tprintf("cost: %s; ram: %s", index, ns.formatNumber(totalUpgradeCost), ns.formatRam(ram))
    if (!isFinite(totalUpgradeCost)) {
        ns.tprint("ERROR: Unable to upgrade servers")
    }
    else if (totalUpgradeCost > myMoney) {
        ns.tprintf("ERROR: You would need %s to upgrade all servers to %i (%s)", ns.formatNumber(totalUpgradeCost), ram, ns.formatRam(ram))
    } else {
        ns.tprintf("can upgrade all servers to: %i (%s) for %s", ram, ns.formatNumber(ram), ns.formatNumber(totalUpgradeCost))
    }
}
