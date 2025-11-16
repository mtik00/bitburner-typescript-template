import { NS } from "@ns";
import { CORP_NAME } from "/corp/const";
import { writeStatus } from "/lib/scripting";

export async function main(ns: NS): Promise<void> {
    const script = ns.getScriptName()
    if (ns.corporation.hasCorporation()) {
        ns.tprintf("%s: %s already created", script, CORP_NAME)
        return
    }

    if (!ns.corporation.canCreateCorporation(false)) {
        ns.tprintf("ERROR: You cannot create a corporation")
        writeStatus(ns, script, "FAILED")
        return
    }

    const wasCreated = ns.corporation.createCorporation(CORP_NAME, false)
    if (wasCreated) {
        ns.tprintf("🥳 Corporation %s has been created", CORP_NAME)
    } else {
        ns.tprintf("ERROR: Could not create corpration")
        writeStatus(ns, script, "FAILED")
    }

}
