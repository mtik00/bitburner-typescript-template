import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";
import { writeFailedStatus } from "/lib/scripting";
import { getGameConfig, DEFAULT_INIT_MATERIALS } from "/lib/config";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    const config = getGameConfig(ns)
    const initMaterials = config.company?.initMaterials || DEFAULT_INIT_MATERIALS

    for (const city of CITY_FACTIONS) {
        const nsCity = city as CityName

        ns.tprintf("%s: --- %s", ns.getScriptName(), city)
        for (const key in initMaterials) {
            const have = ns.corporation.getMaterial(DIVISION_NAME, nsCity, key).stored
            const need = initMaterials[key] - have

            if (need > 0) {
                try {
                    ns.corporation.bulkPurchase(DIVISION_NAME, nsCity, key, need)
                    ns.tprintf("...Bought %s of %s", need, key)
                } catch (error) {
                    writeFailedStatus(ns, ns.getScriptName())
                    ns.tprintf("ERROR ...Could not buy %s of %s", need, key)
                }
            } else {
                ns.tprintf("...Already have %s of %s", have, key)
            }
        }
    }
}
