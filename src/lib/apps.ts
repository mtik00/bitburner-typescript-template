import { NS } from "@ns";
import { HACK_PROGRAMS, PURCHASED_SERVER_HOSTNAME } from "./const";

export function appCount(ns: NS): number {
    let portCount = 0;
    for (const program of HACK_PROGRAMS) {
        ns.fileExists(program) && portCount++

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
    if (target == "home" || target.startsWith(PURCHASED_SERVER_HOSTNAME)) {
        return 99;
    }

    const portPrograms = [
        { file: "BruteSSH.exe", fn: ns.brutessh },
        { file: "FTPCrack.exe", fn: ns.ftpcrack },
        { file: "relaySMTP.exe", fn: ns.relaysmtp },
        { file: "HTTPWorm.exe", fn: ns.httpworm },
        { file: "SQLInject.exe", fn: ns.sqlinject }
    ];

    return portPrograms.reduce((count, { file, fn }) => {
        if (ns.fileExists(file)) {
            fn.call(ns, target);
            return count + 1;
        }
        return count;
    }, 0);
}
