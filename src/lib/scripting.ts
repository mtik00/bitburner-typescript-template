import { NS, ProcessInfo } from "@ns";

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


/**
 * This is a super dumb algorithm and is highly specific to my scripts.
 * It's fine, but I'm not sure how to make this generic.
 * @param proc 
 * @returns 
 */
export function isAHackingProcess(proc: ProcessInfo): boolean {
    return proc.filename.includes("hack") || proc.filename.startsWith("h")
}

const FAILED_STATUS = "FAILED"

export function writeFailedStatus(ns: NS, script: string) {
    const statusFile = `/logs/tmp-${script}.txt`
    ns.write(statusFile, FAILED_STATUS, "w")
}

export function writeStatus(ns: NS, script: string, status: string) {
    const statusFile = `/logs/tmp-${script}.txt`
    ns.write(statusFile, status, "w")
}

export function getStatus(ns: NS, script: string): boolean {
    const statusFile = `/logs/tmp-${script}.txt`
    if (ns.fileExists(statusFile)) {
        const text = ns.read(statusFile)
        ns.tprintf(">>>>>%s<<<<<", statusFile)
        ns.tprintf(">>>>>%s<<<<<", text)
        return text !== FAILED_STATUS
    }
    return true
}
