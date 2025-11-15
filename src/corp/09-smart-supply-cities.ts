import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    for (const city of CITY_FACTIONS) {
        const nsCity = city as CityName
        ns.corporation.setSmartSupply(DIVISION_NAME, nsCity, true)
        ns.tprintf("Smart supply configured in %s", city)
    }
}
