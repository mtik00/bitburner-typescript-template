import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";
import { writeFailedStatus } from "/lib/scripting";

const DIVISION_NAME = DIVISIONS[0]

const Upgrades = new Map<string, number>([
    ["Hardware", 1],
    ["AI Cores", 75],
    ["Real Estate", 2700],
])


export async function main(ns: NS): Promise<void> {
    for (const city of CITY_FACTIONS) {
        const nsCity = city as CityName

        for (const key in Upgrades) {
            const need = Upgrades.get(key) as number - ns.corporation.getMaterial(DIVISION_NAME, nsCity, key).stored

            if (need > 0) {
                try {
                    ns.corporation.bulkPurchase(DIVISION_NAME, nsCity, key, need)
                    ns.tprintf("%s: Bought %s of %s for %s", ns.getScriptName(), need, key, city)
                } catch (error) {
                    writeFailedStatus(ns, ns.getScriptName())
                    ns.tprintf("ERROR %s: Could not buy %s of %s for %s", ns.getScriptName(), need, key, city)
                }
            }
        }
    }
}
