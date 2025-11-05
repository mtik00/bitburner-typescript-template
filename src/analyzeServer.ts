import { NS } from "@ns";
import { filterHackableServers } from "./lib/autocomplete";

export async function main(ns: NS) {
    const args = ns.flags([["help", false]]);
    const server = ns.args[0].toString()
    if (args.help || !server) {
        ns.tprint("This script does a more detailed analysis of a server.");
        ns.tprint(`Usage: run ${ns.getScriptName()} SERVER`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} n00dles`);
        return;
    }

    const ram = [ns.getServerMaxRam(server), ns.getServerUsedRam(server)]
    const money = ns.getServerMoneyAvailable(server);
    const maxMoney = ns.getServerMaxMoney(server);
    const minSec = ns.getServerMinSecurityLevel(server);
    const sec = ns.getServerSecurityLevel(server);
    ns.tprint(`

${server}:
    RAM          : ${ram[1]} / ${ram[0]} (${ram[1] / ram[0] * 100}%)
    $            : $${ns.formatNumber(money, 2)} / $${ns.formatNumber(maxMoney, 2)} (${(money / maxMoney * 100).toFixed(2)}%)
    security     : ${minSec.toFixed(2)} / ${sec.toFixed(2)}
    level        : ${ns.getServerRequiredHackingLevel(server)}
    growth       : ${ns.getServerGrowth(server)}
    hack time    : ${ns.tFormat(ns.getHackTime(server))}
    grow time    : ${ns.tFormat(ns.getGrowTime(server))}
    weaken time  : ${ns.tFormat(ns.getWeakenTime(server))}
    hackChance   : ${(ns.hackAnalyzeChance(server) * 100).toFixed(2)}%
    Ports        : ${ns.getServer(server).openPortCount} of ${ns.getServer(server).numOpenPortsRequired} required
    Req Hack Lvl : ${ns.getServerRequiredHackingLevel(server)}
    Backdoor?    : ${ns.getServer(server).backdoorInstalled ? "YES" : "NO"}
`);
}

export function autocomplete(data: any, args: any) {
    return filterHackableServers(data);
}
