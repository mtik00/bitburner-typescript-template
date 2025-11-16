import { NS } from "@ns";

export interface CompanyConfig {
    initMaterials?: InitialCompanyMaterials
}

export interface InitialCompanyMaterials {
    "Hardware": number,
    "AI Cores": number,
    "Real Estate": number,
    [key: string]: number
}

export const DEFAULT_INIT_MATERIALS: InitialCompanyMaterials = {
    "Hardware": 125,
    "AI Cores": 75,
    "Real Estate": 2700
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
    upgradeHome: true,
    upgradePurchased: true,
    keepMonies: 0,
    company: {
        initMaterials: DEFAULT_INIT_MATERIALS
    }
}

export interface GameConfig {
    upgradeHome?: boolean
    upgradePurchased?: boolean
    keepMonies?: number
    company?: CompanyConfig
}

export function getGameConfig(ns: NS): GameConfig {
    return loadConfig<GameConfig>(ns, "/lib/game-config.txt", DEFAULT_GAME_CONFIG);
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
