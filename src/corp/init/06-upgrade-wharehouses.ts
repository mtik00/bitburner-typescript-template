import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    for (const city of CITY_FACTIONS) {
        const nsCity = city as CityName

        if (ns.corporation.getWarehouse(DIVISION_NAME, nsCity).size >= 300) {
            ns.tprintf("%s: wharehouse already upgraded for %s", ns.getScriptName(), city)
            continue
        }

        ns.corporation.upgradeWarehouse(DIVISION_NAME, nsCity, 2)
        ns.tprintf("%s: Upgraded wharehouse for %s", ns.getScriptName(), city)
    }
}
