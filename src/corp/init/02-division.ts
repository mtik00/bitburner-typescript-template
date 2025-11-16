import { NS } from "@ns";
import { DIVISIONS } from "/corp/const";

export async function main(ns: NS): Promise<void> {
    try {
        ns.corporation.getDivision(DIVISIONS[0])
        ns.tprintf("%s: division %s already created", ns.getScriptName(), DIVISIONS[0])
    } catch (error) {
        ns.corporation.expandIndustry("Agriculture", DIVISIONS[0])
        ns.tprintf("%s: division %s has been created", ns.getScriptName(), DIVISIONS[0])
    }
}
