import { NS } from "@ns";
import { getSwarm, getThreads } from "./helpers";


export async function main(ns: NS) {
    const options = ns.flags([
        ['command', 'focusWeaken'],
        ['target', 'joesguns'],
    ]);

    const command = options.command.toString()
    const target = options.target.toString()

    let script = ''
    let scriptArgs: string[] = []

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
        ns.tprint(server.server)
        const hostServer = server.hostname
        const threads = server.getThreads(script, server.hostname)

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
