import { NS } from "@ns";
import { CORP_NAME } from "/corp/const";

export async function main(ns: NS): Promise<void> {
    if (!ns.corporation.hasCorporation()) {
        if (!ns.corporation.canCreateCorporation(false)) {
            ns.tprintf("ERROR: You cannot create a corporation")
            return
        }
        const wasCreated = ns.corporation.createCorporation(CORP_NAME, false)
        if (wasCreated) {
            ns.tprintf("🥳 Corporation %s has been created", CORP_NAME)
        } else {
            ns.tprintf("ERROR: Could not create corpration")
            return
        }
    } else {
        ns.tprintf("%s already created", CORP_NAME)
    }
}
