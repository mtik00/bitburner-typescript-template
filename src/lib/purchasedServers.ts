import { NS } from "@ns";
import { PURCHASED_SERVER_HOSTNAME, MAXRAM, DEBUG } from "/lib/const";

export function purchasedHostnameFromIndex(ns: NS, index: number): string {
    return ns.sprintf("%s-%03i", PURCHASED_SERVER_HOSTNAME, index)
}

/**
 * Return the cost of purchasing or upgrading all 25 servers to the specified
 * amount of RAM.
 * @param ns 
 * @param ram 
 * @param purchasedServers 
 * @returns 
 */
export function pservCost(ns: NS, ram: number, purchasedServers: string[] = []): number {
    if (purchasedServers.length === 0) {
        purchasedServers = ns.getPurchasedServers()
    }

    const testHost = purchasedHostnameFromIndex(ns, 1)
    if (purchasedServers.includes(testHost)) {
        return ns.getPurchasedServerUpgradeCost(testHost, ram) * 25
    }

    return ns.getPurchasedServerCost(ram) * 25
}

export function nextPservUpgrade(ns: NS) {
    const hostname = ns.getPurchasedServers()[0]
    const ram = ns.getServerMaxRam(hostname) * 4
    const cost = ns.getPurchasedServerUpgradeCost(hostname, ram) * 25

    if (ram > MAXRAM) {
        return {
            ram: undefined,
            cost: undefined,
        }
    }

    return {
        ram: ram,
        cost: cost,
    }
}


/**
 * This algorithm will purches/upgrade the maximum amount of RAM with at least
 * 2 steps worth of upgrades.
 * 
 * @param ns 
 * @returns 
 */
export function upgradePurchasedServers(ns: NS) {
    const purchasedServers = ns.getPurchasedServers()

    let ram = 8
    let cost = ns.getPurchasedServerCost(ram) * 25
    if (purchasedServers.length > 0) {
        const thost = purchasedHostnameFromIndex(ns, 1)
        ram = ns.getServerMaxRam(thost) * 4
        cost = ns.getPurchasedServerUpgradeCost(thost, ram) * 25
    }

    DEBUG && ns.print(`ram: ${ns.formatRam(ram)}; cost: ${ns.formatNumber(cost, 2)}`)
    if (ram > MAXRAM || (cost > ns.getPlayer().money)) {
        return
    }

    // If we got here, we can afford at least 2 steps.  Keep trying the next
    // steps to see if we can afford it.
    let idx = 0
    while (ram < MAXRAM && idx < 100) {
        idx += 1

        const testCost = pservCost(ns, ram * 2, purchasedServers)
        if (testCost < ns.getPlayer().money) {
            ram *= 2
            cost = testCost
        } else {
            break
        }
    }

    if (cost > ns.getPlayer().money) {
        ns.tprintf("ERROR: Bad calculation in upgradePurchasedServers")
        ns.tprintf("ERROR: ram: %s; cost %s", ns.formatRam(ram), ns.formatNumber(cost, 2))
        return
    }

    const range = Array.from({ length: 25 }, (_, index) => 1 + index);

    for (const index of range) {
        const hostname = purchasedHostnameFromIndex(ns, index)
        if (purchasedServers.includes(hostname)) {
            ns.tprint(`upgraded ${hostname} to ${ns.formatRam(ram)}`)
            ns.upgradePurchasedServer(hostname, ram)
        } else {
            ns.purchaseServer(hostname, ram)
            ns.tprint(`purchased ${hostname} with ${ns.formatRam(ram)}`)
        }
    }
}
