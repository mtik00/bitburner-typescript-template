import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    for (const city of CITY_FACTIONS) {
        try {
            ns.corporation.expandCity(DIVISION_NAME, city as CityName)
            ns.tprintf("%s: %s expanded to %s", ns.getScriptName(), DIVISION_NAME, city)
        } catch (error) {
            // ignore; we probable already expanded
        }
    }
}
