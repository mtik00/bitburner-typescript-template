import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const options = ns.flags([
        ['target', ''],
        ['loop', false]
    ]);

    if (options.loop) {
        while (options.loop) {
            await ns.weaken(options.target)
            ns.asleep(200)
        }
    } else {
        await ns.weaken(options.target)
    }
}
