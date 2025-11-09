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

/**
 * Load a JSON configuration file and return an object.
 * @param ns 
 * @param filename 
 * @param defaults 
 * @returns Object
 * @example
 * const workoutConfig = loadConfig<WorkoutConfig>(ns, "workout-config.json", {
    enabled: true,
    strengthGoal: 100,
    defenseGoal: 100,
});
 */
export function loadConfig<T>(ns: NS, filename: string, defaults: T): T {
    if (!ns.fileExists(filename)) {
        ns.print(`WARN: Config file ${filename} not found, using defaults`);
        return defaults;
    }

    try {
        const content = ns.read(filename);
        const parsed = JSON.parse(content);

        // Merge with defaults to handle missing keys
        return { ...defaults, ...parsed } as T;
    } catch (error) {
        ns.print(`ERROR: Failed to parse config: ${error}`);
        ns.print("Using default config");
        return defaults;
    }
}
