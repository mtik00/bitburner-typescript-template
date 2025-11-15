import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

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
            ns.corporation.bulkPurchase(DIVISION_NAME, nsCity, key, Upgrades.get(key) as number)
        }
        ns.corporation.bulkPurchase(DIVISION_NAME, nsCity, "Hardware", 125)
        ns.corporation.bulkPurchase(DIVISION_NAME, nsCity, "AI Cores", 75)
        ns.corporation.bulkPurchase(DIVISION_NAME, nsCity, "Real Estate", 27000)
        ns.tprintf("%s: Bought materials for %s", ns.getScriptName(), city)
    }
}
