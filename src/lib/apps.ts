import { NS } from "@ns";

export function appCount(ns: NS): number {
    let portCount = 0;
    if (ns.fileExists("BruteSSH.exe")) {
        portCount++;
    }

    if (ns.fileExists("FTPCrack.exe")) {
        portCount++;
    }

    if (ns.fileExists("relaySMTP.exe")) {
        portCount++;
    }

    if (ns.fileExists("HTTPWorm.exe")) {
        portCount++;
    }

    if (ns.fileExists("SQLInject.exe")) {
        portCount++;
    }

    return portCount;
}

/**
 * 
 * @param ns 
 * @param target The target server to run the apps
 * @returns integer: Numbe of apps ran
 */
export function runApps(ns: NS, target: string): number {
    if (target == "home") {
        return 99;
    }

    let portCount = 0;
    if (ns.fileExists("BruteSSH.exe")) {
        ns.brutessh(target);
        portCount++;
    }

    if (ns.fileExists("FTPCrack.exe")) {
        ns.ftpcrack(target);
        portCount++;
    }

    if (ns.fileExists("relaySMTP.exe")) {
        ns.relaysmtp(target);
        portCount++;
    }

    if (ns.fileExists("HTTPWorm.exe")) {
        ns.httpworm(target);
        portCount++;
    }

    if (ns.fileExists("SQLInject.exe")) {
        ns.sqlinject(target);
        portCount++;
    }

    return portCount;
}
