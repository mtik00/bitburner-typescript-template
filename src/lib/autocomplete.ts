import { ScriptArg } from "@ns";

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
