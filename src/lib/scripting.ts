import { NS } from "@ns";

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


export function enoughRAM(ns: NS, script: string, hostname: string = "home"): boolean {
    return (
        ns.getScriptRam(script, hostname) < (ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname))
    )
}
