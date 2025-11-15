import { NS } from "@ns"
import { getGameConfig } from "/lib/config"


export function getMoney(ns: NS) {
    const config = getGameConfig(ns)

    if (config.keepMonies) {
        return ns.getPlayer().money - config.keepMonies
    } else {
        return ns.getPlayer().money
    }
}
