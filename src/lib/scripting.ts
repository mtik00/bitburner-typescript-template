import { NS } from "@ns";
import { PURCHASED_SERVER_HOSTNAME } from "./const";

export async function waitForScriptComplete(ns: NS, filename: string, hostname: string = "home", sleep = 5000) {
    let idx = 0
    let found = true
    while (found && idx < 1000) {
        idx += 1
        found = false

        const procs = ns.ps(hostname)

        for (const proc of procs) {
            if (proc.filename == filename) {
                await ns.asleep(sleep)
                found = true
            }
        }
    }
}


export async function waitForPIDComplete(ns: NS, pid: number, hostname: string = "home", sleep = 5000) {
    let idx = 0
    let found = true
    while (found && idx < 1000) {
        idx += 1
        found = false

        const procs = ns.ps(hostname)

        for (const proc of procs) {
            if (proc.pid == pid) {
                await ns.asleep(sleep)
                found = true
            }
        }
    }
}

export function purchasedHostnameFromIndex(ns: NS, index: number): string {
    return ns.sprintf("%s-%03i", PURCHASED_SERVER_HOSTNAME, 1)
} 
