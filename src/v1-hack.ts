
import { NS } from "@ns";

export async function main(ns: NS) {
    const options = ns.flags([
        ['target', 'n00dles'],
        ['moneyThresh', 0.0],
        ['securityThresh', 0]
    ]);
    const target = options.target.toString()
    const moneyThresh = parseFloat(options.moneyThresh.toString())
    const securityThresh = parseInt(options.securityThresh.toString())

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
