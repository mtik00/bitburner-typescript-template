import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    ns.corporation.purchaseUnlock("Smart Supply")
    ns.tprintf("Smart Supply purchased")
}
