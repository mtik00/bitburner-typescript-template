import { NS } from "@ns";
import { purchasedHostnameFromIndex } from "/lib/purchasedServers";
import { MAXRAM } from "/lib/const";

function upgradeCost(ns: NS, ram: number) {
    if (ns.getPurchasedServers().length > 0) {
        return ns.getPurchasedServerUpgradeCost(purchasedHostnameFromIndex(ns, 1), ram) * 25.0
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

    const purchasedServers = ns.getPurchasedServers()
    let startingRam = 0

    if (purchasedServers.length > 0) {
        startingRam = ns.getServerMaxRam(purchasedServers[0])
    }

    debug && ns.tprintf("Maximum RAM available: %s", ns.formatRam(MAXRAM))

    var ram = 2

    let index = 0
    let numCantAfford = 0

    while (ram < MAXRAM) {
        ram *= 2
        index += 1
        if (index > 30) {
            break
        }

        var totalUpgradeCost = upgradeCost(ns, ram)
        if (totalUpgradeCost < 0) {
            continue
        } else if (totalUpgradeCost <= myMoney) {
            ns.tprintf(
                "You can upgrade/purchase all servers from %s to: %s (%i) for %s",
                ns.formatRam(startingRam, 0),
                ns.formatRam(ram, 0),
                ram,
                ns.formatNumber(totalUpgradeCost)
            )
        } else if (totalUpgradeCost > myMoney) {
            numCantAfford += 1
            ns.tprintf(
                "WARN: You cannot upgrade/purchase all servers from %s to: %s (%i) for %s",
                ns.formatRam(startingRam, 0),
                ns.formatRam(ram, 0),
                ram,
                ns.formatNumber(totalUpgradeCost)
            )
        }

        if (numCantAfford > 1) {
            break
        }
    }
}
