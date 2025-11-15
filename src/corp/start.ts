import { NS, CityName } from "@ns";
import { CORP_NAME, DIVISIONS } from "/corp/const";
import { waitForPIDComplete } from "/lib/scripting";
import { getStatus } from "/lib/scripting";
/**
 * - Start corp
 * - Expand to Aggy
 * - Buy smart supply
 * - ENABLE SMART SUPPLY (wharehouse.setSmartSupply)
 * - Expand to all Cities
 * - Hire 3 employees for all offices
 * - Assign employees to Operations, Engineer, and Business.
 * - Buy wharehouse (wharehouse.purchaseWarehouse)
 * - Buy single advert
 * - Upgrade each offices' storage to 300 (wharehouse.upgradeWarehouse(2))
 * - Configure sell for each office (plants and food) wharehouse.sellProduct()
 * - Upgrades (x2)
 *     - FocusWires
       - Neural Accelerators
       - Speech Processor Implants
       - Nuoptimal Nootropic Injector Implants
       - Smart Factories
 * - Buy for all office:
       - 125 Hardware
       - 75 AI Cores
       - 27000 Real Estate
* - Wait for moral 100, energy 100
 */

const SCRIPTS = [
    "/corp/01-corp.js",
    "/corp/02-division.js",
    "/corp/03-expand-division.js",
    "/corp/04-employees.js",
    "/corp/05-purchase-wharehouses.js",
    "/corp/06-upgrade-wharehouses.js",
    "/corp/07-buy.js",
    "/corp/08-smart-supply.js",
    "/corp/09-smart-supply-cities.js",
    "/corp/10-sell.js",
    "/corp/11-advert.js",
    "/corp/12-upgrades.js",
]

async function exec(ns: NS, script: string): Promise<boolean> {
    const mem = ns.getScriptRam(script)
    if ((ns.getServerMaxRam("home") - ns.getServerUsedRam("home")) < mem) {
        ns.tprintf("ERROR: Not enough ram to run /corp/startIndustry.js")
        return false
    } else {
        const pid = ns.run(script)
        if (pid === 0) {
            ns.tprintf("Could not run %s (pid 0)", script)
            return false
        } else {
            await waitForPIDComplete(ns, pid)
            return getStatus(ns, script)
        }
    }
}


export async function main(ns: NS): Promise<void> {
    for (const script of SCRIPTS) {
        const ok = await exec(ns, script)
        if (!ok) {
            ns.tprintf("stopping loop")
            break
        }
    }
}
