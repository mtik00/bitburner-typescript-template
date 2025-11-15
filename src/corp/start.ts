import { NS, CityName } from "@ns";
import { CORP_NAME, DIVISIONS } from "/corp/const";
import { waitForPIDComplete } from "/lib/scripting";
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

// function configureOffice(ns: NS, city: CityName, division: string) {
//     ns.corporation.hireEmployee(division, city, "Operations")
//     ns.corporation.hireEmployee(division, city, "Engineer")
//     ns.corporation.hireEmployee(division, city, "Business")
//     ns.corporation.purchaseWarehouse(division, city)
//     ns.corporation.upgradeWarehouse(division, city, 2)

//     ns.corporation.bulkPurchase(division, city, "Hardware", 125)
//     ns.corporation.bulkPurchase(division, city, "AI Cores", 75)
//     ns.corporation.bulkPurchase(division, city, "Real Estate", 27000)

//     ns.corporation.setSmartSupply(division, city, true)
//     ns.corporation.sellProduct(division, city, "Plants", "MAX", "MP", false)
//     ns.corporation.sellProduct(division, city, "Food", "MAX", "MP", false)
// }

export async function main(ns: NS): Promise<void> {
    if (!ns.corporation.hasCorporation()) {
        if (!ns.corporation.canCreateCorporation(false)) {
            ns.tprintf("ERROR: You cannot create a corporation")
            return
        }
        const wasCreated = ns.corporation.createCorporation(CORP_NAME, false)
        if (!wasCreated) {
            ns.tprintf("ERROR: Could not create corpration")
            return
        }
    }

    const mem = ns.getScriptRam("/corp/startIndustry.js")
    if ((ns.getServerMaxRam("home") - ns.getServerUsedRam("home")) < mem) {
        ns.tprintf("ERROR: Not enough ram to run /corp/startIndustry.js")
    } else {
        const pid = ns.run("/corp/startIndustry.js")
        if (pid === 0) {
            ns.tprint("Could not run /corp/startIndustry.js")
        } else {
            await waitForPIDComplete(ns, pid)
            ns.tprintf("%s OK", DIVISIONS[0])
        }
    }
}
