// @ts-nocheck
import { NS, ScriptArg } from '@ns'
import { scanAllServers, getArgValue } from './helpers.js'


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

function get_server_data(ns: NS, hostname: string) {
    /*
    Creates the info text for each server. Currently gets money, security, and ram.
    NOTE: ns.getServer() can return a server object and obtain all of the necessary properties.
    However, ns.getServer() costs 2GB, which doubles the RAM requirement for this script.
    */
    var moneyAvailable = ns.getServerMoneyAvailable(hostname).toString()
    var moneyMax = ns.getServerMaxMoney(hostname)
    var securityLvl = ns.getServerSecurityLevel(hostname)
    var securityMin = ns.getServerMinSecurityLevel(hostname)
    var ram = ns.getServerMaxRam(hostname)
    return `${pad_str(hostname, 17)}` +
        ` money:${pad_str(parseInt(moneyAvailable), 12)}/${pad_str(parseInt(moneyMax), 12)}(${pad_str((moneyAvailable / moneyMax).toFixed(2), 4)})` +
        ` security:${pad_str(securityLvl.toFixed(2), 6)}(${pad_str(securityMin, 2)})` +
        ` RAM:${pad_str(parseInt(ram), 4)}` +
        ` Action: ${get_action(ns, hostname)}`
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
    keys.sort((a, b) => ns.getServerMaxMoney(a) - ns.getServerMaxMoney(b))

    for (var i in keys) {
        var key = keys[i]
        if (key == "home" || key.startsWith("pserv") || ns.getServerMaxMoney(key) === 0)
            continue
        ns.tprint(stats[key])
    }
}
