import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";
import { writeStatus } from "/lib/scripting";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    if (ns.corporation.hasUnlock("Smart Supply")) {
        ns.tprintf("%s: Already have Smart Supply")
        return
    }

    try {
        ns.corporation.purchaseUnlock("Smart Supply")
        ns.tprint("Smart Supply purchased")
    } catch (error) {
        writeStatus(ns, ns.getScriptName(), "FAILED")
    }
}
