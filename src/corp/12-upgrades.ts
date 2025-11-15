import { NS, CityName } from "@ns";
import { DIVISIONS } from "/corp/const";
import { CITY_FACTIONS } from "/lib/const";

const DIVISION_NAME = DIVISIONS[0]

export async function main(ns: NS): Promise<void> {
    ns.corporation.levelUpgrade("FocusWires")
    ns.corporation.levelUpgrade("Neural Accelerators")
    ns.corporation.levelUpgrade("Speech Processor Implants")
    ns.corporation.levelUpgrade("Nuoptimal Nootropic Injector Implants")
    ns.corporation.levelUpgrade("Smart Factories")

    // ns.corporation.levelUpgrade("FocusWires")
    // ns.corporation.levelUpgrade("Neural Accelerators")
    // ns.corporation.levelUpgrade("Speech Processor Implants")
    // ns.corporation.levelUpgrade("Nuoptimal Nootropic Injector Implants")
    // ns.corporation.levelUpgrade("Smart Factories")

    ns.tprintf("Upgrades purchased")
}
