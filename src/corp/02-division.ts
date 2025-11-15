import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";

export async function main(ns: NS): Promise<void> {
    try {
        const div = ns.corporation.getDivision(DIVISIONS[0])
        ns.tprintf("division %s already created", DIVISIONS[0])
    } catch (error) {
        ns.corporation.expandIndustry("Agriculture", DIVISIONS[0])
        ns.tprintf("division %s has been created", DIVISIONS[0])
    }
}
