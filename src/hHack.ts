import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.hack(ns.args[0])
}
