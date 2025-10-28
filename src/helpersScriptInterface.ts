/*
This module holds utilities for scripts that don't use any memory.
*/
import { NS, Server, ProcessInfo, ScriptArg } from "@ns";

export const RAM = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
export const HOME_RAM_KEEP = 32
export const backdoorServers = new Set(["CSEC", "I.I.I.I", "avmnite-02h", "run4theh111z", "clarkinc", "nwo", "omnitek", "fulcrumtech", "fulcrumassets", "w0r1d_d43m0n"]);


/**
 * A generic function for creating autocomplete data.
 * See also: https://github.com/bitburner-official/bitburner-src/blob/stable/src/Documentation/doc/basic/autocomplete.md
 * 
 * For example:
 * 
 * export function autocomplete(data: any, args: any) {
     return createFlagAutocomplete({
       "--target": (data: any) => data.servers,
       "--script": (data: any) => data.scripts,
     })(data, args);
    }
 * 
 * @param flagConfig The configurtion for autocompleting flags
 * @returns auto-compleatable configuration
 */
export function createFlagAutocomplete(flagConfig: Record<string, any>) {
    return function (data: any, args: any) {
        const lastArg = args[args.length - 1];
        const previousArg = args.length > 1 ? args[args.length - 2] : null;

        // Check each flag in the config
        for (const [flag, values] of Object.entries(flagConfig)) {
            if (lastArg === flag || previousArg === flag) {
                // If values is a function, call it with data
                return typeof values === 'function' ? values(data) : values;
            }
        }

        // Return list of available flags
        return Object.keys(flagConfig);
    };
}

export function getServerFromStockSymbol(symbol: string): string {
    const symServer: Record<string, string> = {
        "WDS": "",
        "ECP": "ecorp",
        "MGCP": "megacorp",
        "BLD": "blade",
        "CLRK": "clarkinc",
        "OMTK": "omnitek",
        "FSIG": "4sigma",
        "KGI": "kuai-gong",
        "DCOMM": "defcomm",
        "VITA": "vitalife",
        "ICRS": "icarus",
        "UNV": "univ-energy",
        "AERO": "aerocorp",
        "SLRS": "solaris",
        "GPH": "global-pharm",
        "NVMD": "nova-med",
        "LXO": "lexo-corp",
        "RHOC": "rho-construction",
        "APHE": "alpha-ent",
        "SYSC": "syscore",
        "CTK": "comptek",
        "NTLK": "netlink",
        "OMGA": "omega-net",
        "JGN": "joesguns",
        "SGC": "sigma-cosmetics",
        "CTYS": "catalyst",
        "MDYN": "microdyne",
        "TITN": "titan-labs",
        "FLCM": "fulcrumtech",
        "STM": "stormtech",
        "HLS": "helios",
        "OMN": "omnia",
        "FNS": "foodnstuff"
    }

    return symServer[symbol];
}

/**
 * 
 * @param data ns data
 * @returns A list of hostnames from the servers without "home" or "pserv"
 */
export function filterHackableServers(data: any): string[] {
    return data.servers.filter((s: string) => s !== "home" && !s.startsWith("pserv"));
}

/**
 * 
 * @param args List of process args
 * @param flag Flag to search for
 * @returns 
 */
export function getArgValue(args: ScriptArg[], flag: string): ScriptArg | undefined {
    const flagIndex = args.indexOf(flag);
    if (flagIndex !== -1 && flagIndex < args.length - 1) {
        return args[flagIndex + 1];
    }
    return undefined;
}
