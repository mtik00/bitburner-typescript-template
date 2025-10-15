// @ts-nocheck
/**
 * This script is used to re-target servers to a new host.
 * 
 * By default, only our purchased servers are retargeted.  Use `--all` to re-target
 * all servers know about, include home.
 */
import { NS } from "@ns";
import { getThreads, findHackPID, scanAllServers } from './helpers.js'

export async function main(ns: NS) {
    const options = ns.flags([
        ['target', ''],
        ['script', 'v1-hack.js'],
        ['serverMoneyThresholdFactor', 0.75],
        ['securityThreshAdjust', 5],
        ['all', false],
    ]);

    const target = options.target.toString()
    const script = options.script.toString()
    const all = options.all

    if (target === "") {
        ns.tprint(`USAGE: ${ns.getScriptName()} --target <name>`);
        return
    }

    const moneyThresh = ns.getServerMaxMoney(target) * options.serverMoneyThresholdFactor
    const securityThresh = ns.getServerMinSecurityLevel(target) + options.securityThreshAdjust

    const hostServers = all ? scanAllServers(ns) : ns.getPurchasedServers()
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

        const threads = getThreads(ns, script, hostServer)
        if (threads < 1) {
            continue
        }

        ns.exec(script, hostServer, threads, "--target", target, "--moneyThresh", moneyThresh, "--securityThresh", securityThresh);
        ns.tprintf("executed %s on %s, targeting %s, with -t=%s", script, hostServer, target, threads);
    }
}
