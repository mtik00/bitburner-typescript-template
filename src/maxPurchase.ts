import { NS } from "@ns";

function upgradeCost(ns: NS, ram: number) {
    if (ns.getPurchasedServers().length > 0) {
        return ns.getPurchasedServerUpgradeCost("pserv-001", ram) * 25.0
    } else {
        return ns.getPurchasedServerCost(ram) * 25.0
    }
}

export async function main(ns: NS): Promise<void> {
    const args = ns.flags([
        ["debug", false]
    ]);
    const debug = Boolean(args.debug)
    const myMoney = ns.getServerMoneyAvailable("home")

    const maxRam = Math.pow(2, 20) // 1048576

    debug && ns.tprintf("Maximum RAM available: %s", ns.formatRam(maxRam))

    var ram = 8
    var totalUpgradeCost = upgradeCost(ns, ram)

    let index = 0
    while (ram <= maxRam && index < 30) {
        index += 1
        debug && ns.tprintf("step: %i; cost: %s; ram: %s", index, totalUpgradeCost, ns.formatRam(ram))

        if (totalUpgradeCost > myMoney) {
            ram /= 2
            totalUpgradeCost = upgradeCost(ns, ram)
            break
        }

        ram *= 2
        totalUpgradeCost = upgradeCost(ns, ram)
    }

    debug && ns.tprintf("after loop: step: %i, cost: %s; ram: %s", index, ns.formatNumber(totalUpgradeCost), ns.formatRam(ram))

    if (!isFinite(totalUpgradeCost)) {
        ns.tprint("ERROR: Unable to upgrade servers")
    }
    else if (totalUpgradeCost < 0) {
        ns.tprintf("ERROR: You don't have enough money ($%s) to upgrade your servers to %s", ns.formatNumber(upgradeCost(ns, ram * 2)), ns.formatRam(ram * 2, 0))
    }
    else if (totalUpgradeCost > myMoney) {
        ns.tprintf("ERROR: You would need %s to upgrade all servers to %i (%s)", ns.formatNumber(totalUpgradeCost), ram, ns.formatRam(ram))
    } else {
        ns.tprintf("can upgrade/purchase all servers with: %s (%i) for %s", ns.formatRam(ram), ram, ns.formatNumber(totalUpgradeCost))
    }
}
