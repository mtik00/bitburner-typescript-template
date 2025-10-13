// 1.75GM
import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const options = ns.flags([
        ['target', ''],
        ['loop', false],
        ['sleepMs', 200]
    ]);

    const target = options.target.toString()
    const sleepMs = parseInt(options.sleepMs.toString())

    if (options.loop) {
        while (options.loop) {
            await ns.grow(target)
            ns.asleep(sleepMs)
        }
    } else {
        await ns.grow(target)
    }
}
