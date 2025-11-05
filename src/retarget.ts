/**
 * This script is used to re-target servers to a new host.
 * 
 * By default, only our purchased servers are retargeted.  Use `--all` to re-target
 * all servers know about, include home.
 */
import { NS } from "@ns";
import { getThreads, findHackPID, scanAllServers } from './helpers.js'
import { createFlagAutocomplete, filterHackableServers } from '/lib/autocomplete.js'

interface FlagsSchema {
    script: string
    target: string
    serverMoneyThresholdFactor: number
    securityThreshAdjust: number
    all: boolean
}

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['target', ''],
    ['script', 'v1-hack.js'],
    ['serverMoneyThresholdFactor', 0.75],
    ['securityThreshAdjust', 5],
    ['all', false],]

export function autocomplete(data: any, args: any) {
    return createFlagAutocomplete({
        "--target": (data: any) => filterHackableServers(data),
        "--script": (data: any) => data.scripts,
    })(data, args);
}

export async function main(ns: NS) {
    const options = ns.flags(argsSchema) as unknown as FlagsSchema

    if (options.target === "") {
        ns.tprint(`USAGE: ${ns.getScriptName()} --target <name>`);
        return
    }

    const moneyThresh = ns.getServerMaxMoney(options.target) * options.serverMoneyThresholdFactor
    const securityThresh = ns.getServerMinSecurityLevel(options.target) + options.securityThreshAdjust

    const hostServers = options.all ? scanAllServers(ns) : ns.getPurchasedServers()
    for (let index = 0; index < hostServers.length; index++) {
        const hostServer = hostServers[index];
        if (hostServer !== "home") {
            ns.killall(hostServer)
        } else {
            // Only find and kill the hack
            const hackPID = findHackPID(ns, "home")
            if (hackPID > 0) {
                ns.kill(hackPID)
            }
        }

        const threads = getThreads(ns, options.script, hostServer)
        if (threads < 1) {
            continue
        }

        ns.exec(options.script, hostServer, threads, "--target", options.target, "--moneyThresh", moneyThresh, "--securityThresh", securityThresh);
        ns.tprintf("executed %s on %s, targeting %s, with -t=%s", options.script, hostServer, options.target, threads);
    }
}
