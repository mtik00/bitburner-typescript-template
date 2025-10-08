import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.weaken(ns.args[0])
}
