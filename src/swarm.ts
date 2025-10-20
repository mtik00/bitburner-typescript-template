import { NS } from "@ns";
import { getSwarm, getThreads } from "./helpers";


export async function main(ns: NS) {
    const options = ns.flags([
        ['command', 'focusWeaken'],
        ['target', 'joesguns'],
        ['select', 'all'],
        ['quiet', true],
    ]);

    const command = options.command.toString()
    const target = options.target.toString()
    const select = options.select.toString()
    const quiet = options.quiet.toString() === 'true'

    let home = false
    let purchased = false
    let script = ''
    let scriptArgs: string[] = []

    switch (select) {
        case "all":
            home = true
            purchased = true
            break;
        case "home":
            home = true
            break;
        case "purchased":
            purchased = true
        default:
            ns.tprintf("ERROR: Unknown select: %s", select)
            return;
    }

    switch (command) {
        case "focusWeaken":
            script = "hWeaken.js"
            scriptArgs = ["--target", target, "--loop"]
            break;

        default:
            break;
    }

    if (script === '') {
        ns.tprint("ERROR: Unknown command:", command)
    }

    for (const server of getSwarm(ns)) {
        if (!home && server.hostname === "home") {
            !quiet && ns.tprint("...ignoring home")
            continue
        } else if (!purchased && server.hostname.startsWith("pserv")) {
            !quiet && ns.tprint("...ignoring", server.hostname)
            continue
        }

        const hostServer = server.hostname
        const threads = server.getThreads(script)

        if (threads < 1) {
            continue
        } else if (!isFinite(threads)) {
            ns.tprint("ERROR: Could not calculate threads for", hostServer)
            continue
        }

        ns.scp(script, hostServer);
        ns.exec(script, hostServer, threads, ...scriptArgs);
    }


}
