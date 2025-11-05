// @ts-nocheck
import { NS } from '@ns'
import { scanAllServers } from './lib/scan'
import { getArgValue } from './helpersScriptInterface.js'


function get_action(ns: NS, host: string) {
    /*
    Gets the first action in the list and returns it.
    */
    var actions = ns.ps(host)
    if (actions.length == 0) {
        return null
    }
    const filename = actions[0].filename.replace("scripts/", "").replace(".js", "")
    const target = getArgValue(actions[0].args, "--target")
    return `${filename}(${target === undefined ? '??' : target})`
}

function pad_str(str: string, len: number) {
    /*
    Prepends the requested padding to the string.
    */
    var pad = "                      "
    return String(pad + str).slice(-len)
}

function dollarsPerSecond(ns: NS, hostname: string): number {
    return (ns.getServerMaxMoney(hostname) * ns.hackAnalyzeChance(hostname)) / (ns.getWeakenTime(hostname) + ns.getGrowTime(hostname) + ns.getHackTime(hostname))
}

function get_server_data(ns: NS, hostname: string) {
    /*
    Creates the info text for each server. Currently gets money, security, and ram.
    NOTE: ns.getServer() can return a server object and obtain all of the necessary properties.
    However, ns.getServer() costs 2GB, which doubles the RAM requirement for this script.
    */
    const moneyAvailable = ns.getServerMoneyAvailable(hostname).toString()
    const moneyMax = ns.getServerMaxMoney(hostname)
    const securityLvl = ns.getServerSecurityLevel(hostname)
    const securityMin = ns.getServerMinSecurityLevel(hostname)
    const ram = ns.getServerMaxRam(hostname)
    const value = dollarsPerSecond(ns, hostname)

    return `${pad_str(hostname, 17)}` +
        ` money:${pad_str(parseInt(moneyAvailable), 12)}/${pad_str(parseInt(moneyMax), 12)}(${pad_str((moneyAvailable / moneyMax).toFixed(2), 4)})` +
        ` security:${pad_str(securityLvl.toFixed(2), 6)}(${pad_str(securityMin, 2)})` +
        ` RAM:${pad_str(parseInt(ram), 4)}` +
        ` $/s: ${ns.formatNumber(value, 2)}`
}

export async function main(ns: NS) {
    var servers = scanAllServers(ns, false)
    var stats = {}

    // For each server in servers, get the server data and add to our Hash Table.
    for (var server of servers) {
        stats[server] = get_server_data(ns, server)
    }

    // Sort each server based on how much money it holds.
    var keys = Object.keys(stats)
    // keys.sort((a, b) => ns.getServerMaxMoney(a) - ns.getServerMaxMoney(b))
    keys.sort((a, b) => dollarsPerSecond(ns, a) - dollarsPerSecond(ns, b))

    for (var i in keys) {
        var key = keys[i]
        if (key == "home" || key.startsWith("pserv") || ns.getServerMaxMoney(key) === 0)
            continue
        ns.tprint(stats[key])
    }
}
