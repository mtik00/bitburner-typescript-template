// @ts-nocheck
import { NS, ScriptArg } from '@ns'
import { scanAllServers } from './helpers.js'

function getTargetArg(args: ScriptArg[]): ScriptArg | string {
    const targetIndex = args.indexOf('--target');
    if (targetIndex !== -1 && targetIndex < args.length - 1) {
        return args[targetIndex + 1].toString()
    }
    return "??"
}

function get_action(ns: NS, host: string) {
    /*
    Gets the first action in the list and returns it.
    */
    var actions = ns.ps(host)
    if (actions.length == 0) {
        return null
    }
    const filename = actions[0].filename.replace("scripts/", "").replace(".js", "")
    const target = getTargetArg(actions[0].args)
    return `${filename}(${target})`
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
        ` Action:${pad_str(get_action(ns, hostname), 20)}`
}

export async function main(ns: NS) {
    var servers = scanAllServers(ns, false)
    var stats = {}

    // For each server in servers, get the server data and add to our Hash Table.
    for (var server of servers) {
        stats[parseInt(ns.getServerMaxMoney(server))] = get_server_data(ns, server)
    }

    // Sort each server based on how much money it holds.
    var keys = Object.keys(stats)
    keys.sort((a, b) => a - b)

    for (var i in keys) {
        var key = keys[i]
        ns.tprint(stats[key])
    }
}
