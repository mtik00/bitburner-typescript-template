
import { NS } from "@ns";

export async function main(ns: NS) {
    const options = ns.flags([
        ['target', 'n00dles'],
        ['maxMoneyFactor', 0.75],
        ['minSecurityAdjust', 5],
    ]);
    const target = options.target.toString()

    const moneyThresh = ns.getServerMaxMoney(target) * parseFloat(options.maxMoneyFactor.toString())
    const securityThresh = ns.getServerMinSecurityLevel(target) + parseInt(options.minSecurityAdjust.toString())

    while (true) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }
}
