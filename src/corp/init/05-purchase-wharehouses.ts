import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    for (const city of CITY_FACTIONS) {
        const nsCity = city as CityName
        if (ns.corporation.hasWarehouse(DIVISION_NAME, nsCity)) {
            ns.tprintf("%s: wharehouse already exists in %s", ns.getScriptName(), city)
            continue
        }

        ns.corporation.purchaseWarehouse(DIVISION_NAME, nsCity)
        ns.tprintf("%s: Purchased wharehouse for %s", ns.getScriptName(), city)
    }
}
