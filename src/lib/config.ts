import { NS } from "@ns";

export interface GameConfig {
    upgradeHome?: boolean
    upgradePurchased?: boolean
    keepMonies?: number
}

export function getGameConfig(ns: NS): GameConfig {
    return loadConfig<GameConfig>(ns, "/lib/game-config.txt", {
        upgradeHome: true,
        upgradePurchased: true,
        keepMonies: 0,
    });
}

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
