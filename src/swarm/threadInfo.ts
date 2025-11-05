import { NS } from "@ns";
import { getSwarm } from "/lib/swarm";

export async function main(ns: NS) {
    const options = ns.flags([
        ["script", '']
    ]);

    if (options.script.toString() == '') {
        ns.tprint("USAGE: --script <script>")
        return
    }

    let threadCount = 0
    for (const server of getSwarm(ns)) {
        threadCount += server.getThreads(options.script.toString(), undefined, true)
    }

    ns.tprintf("Total number of threads for %s: %i", options.script, threadCount)
}


export function autocomplete(data: any, args: any) {
    return data.scripts;
}
