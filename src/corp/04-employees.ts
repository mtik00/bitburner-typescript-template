import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    for (const city of CITY_FACTIONS) {
        const nsCity = city as CityName
        const numEmployees = ns.corporation.getOffice(DIVISION_NAME, nsCity).numEmployees
        if (numEmployees === 0) {
            ns.corporation.hireEmployee(DIVISION_NAME, nsCity, "Operations")
            ns.corporation.hireEmployee(DIVISION_NAME, nsCity, "Engineer")
            ns.corporation.hireEmployee(DIVISION_NAME, nsCity, "Business")
            ns.tprintf("%s: Hired initial employees for %s", ns.getScriptName(), city)
        } else {
            ns.tprintf("%s: No need to hire initial employees for %s", ns.getScriptName(), city)
        }
    }
}
