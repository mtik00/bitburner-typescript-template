import { NS } from "@ns";
import { writeFailedStatus } from "/lib/scripting";

const UPGRADES = [
    "FocusWires",
    "Neural Accelerators",
    "Speech Processor Implants",
    "Nuoptimal Nootropic Injector Implants",
    "Smart Factories",
]

export async function main(ns: NS): Promise<void> {

    for (const upgrade of UPGRADES) {
        const currentLevel = ns.corporation.getUpgradeLevel(upgrade)
        if (currentLevel === 0) {
            try {
                ns.corporation.levelUpgrade(upgrade)
            } catch (error) {
                ns.tprintf("ERROR %s: Failed to purchase 1st upgrade: %s", ns.getScriptName(), upgrade)
                writeFailedStatus(ns, ns.getScriptName())
                return
            }
        } else {
            ns.tprintf("%s: upgrade '%s' already at %s", ns.getScriptName(), upgrade, currentLevel)
        }
    }

    for (const upgrade of UPGRADES) {
        const currentLevel = ns.corporation.getUpgradeLevel(upgrade)
        if (currentLevel === 1) {
            try {
                ns.corporation.levelUpgrade(upgrade)
            } catch (error) {
                ns.tprintf("ERROR %s: Failed to purchase 1st upgrade: %s", ns.getScriptName(), upgrade)
                writeFailedStatus(ns, ns.getScriptName())
                return
            }
        } else {
            ns.tprintf("%s: upgrade '%s' already at %s", ns.getScriptName(), upgrade, currentLevel)
        }
    }

    ns.tprintf("Upgrades purchased")
}
