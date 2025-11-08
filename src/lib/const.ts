// Set this to enable debug across the entire library
export const DEBUG = false

// Disable this if you cannot use singularity functions
export const SINGULARITY = true

export const RAM = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
export const MAXRAM = Math.pow(2, 20)
export const HOME_RAM_KEEP = 48 // Set this to `mem singularityStartup` + `mem backdoor.js`
export const backdoorServers = new Set([
    "CSEC",
    "I.I.I.I",
    "avmnite-02h",
    "run4theh111z",
    "nwo",
    "omnitek",
    "clarkinc",
    "fulcrumassets",
    "fulcrumtech",
    "iron-gym",
    "powerhouse-fitness",
]);

export const HACK_PROGRAMS = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
]

export const PROGRAMS = [
    ...HACK_PROGRAMS,
    "ServerProfiler.exe",
    "DeepscanV1.exe",
    "DeepscanV2.exe",
    "AutoLink.exe",
    "Formulas.exe",
]

export const PURCHASED_SERVER_HOSTNAME = "pserv"

export const EARLY_GAME_FACTIONS = [
    "CyberSec",
    "Tian Di Hui",
    "Netburners",
]

export const CITY_FACTIONS = [
    "Sector-12",
    "Chongqing",
    "New Tokyo",
    "Ishima",
    "Aevum",
    "Volhaven"
]

export const HACKING_GROUP_FACTIONS = [
    "NiteSec",
    "The Black Hand",
    "BitRunners",
]

export const MEGA_CORPORATION_FACTIONS = [
    "ECorp",
    "MegaCorp",
    "KuaiGong International",
    "Four Sigma",
    "NWO",
    "Blade Industries",
    "OmniTek Incorporated",
    "Bachman & Associates",
    "Clarke Incorporated",
    "Fulcrum Secret Technologies",
]

export const CRIMINAL_ORGANIZATION_FACTIONS = [
    "Slum Snakes",
    "Tetrads",
    "Silhouette",
    "Speakers for the Dead",
    "The Dark Army",
    "The Syndicate",
]

export const ENDGAME_FACTIONS = [
    "The Covenant",
    "Daedalus",
    "Illuminati"
]

export const SAFE_FACTIONS = [
    ...EARLY_GAME_FACTIONS,
    ...HACKING_GROUP_FACTIONS,
    ...MEGA_CORPORATION_FACTIONS,
    ...CRIMINAL_ORGANIZATION_FACTIONS,
    ...ENDGAME_FACTIONS,
]
