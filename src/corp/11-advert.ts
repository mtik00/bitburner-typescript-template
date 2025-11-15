import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    if (ns.corporation.getHireAdVertCount(DIVISION_NAME) === 0) {
        ns.corporation.hireAdVert(DIVISION_NAME)
        ns.tprint("AdVert purchased")
    } else {
        ns.tprint("AdVert already purchased")
    }
}
