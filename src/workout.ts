import { NS, GymLocationName } from "@ns";

const gym = "Iron Gym"
const statMap = {
    str: 'strength',
    def: 'defense',
    dex: 'dexterity',
    agi: 'agility',
} as const;

export async function main(ns: NS) {
    const targetLevelArg = ns.args[0]
    const gym = ns.args[1]
    const targetLevel = targetLevelArg === undefined ? 20 : parseInt(targetLevelArg.toString())
    const trainingGym = (gym ?? "Iron Gym") as GymLocationName

    for (const shorthand of Object.keys(statMap) as Array<keyof typeof statMap>) {
        const statName = statMap[shorthand];
        let currentStat = ns.getPlayer().skills[statName];

        while (currentStat < targetLevel) {
            await ns.singularity.gymWorkout(trainingGym, shorthand, false);
            await ns.asleep(5000);
            currentStat = ns.getPlayer().skills[statName];
        }

        ns.tprint(`${statName} training complete at level ${currentStat}`);
    }

    ns.singularity.stopAction()
}
