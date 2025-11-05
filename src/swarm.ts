import { NS } from "@ns";
import { sortServers } from "./helpers";
import { getSwarm } from "./lib/swarm";
import { scanAllServers } from "./lib/scan";
import { PURCHASED_SERVER_HOSTNAME } from "./lib/const";


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

    let next = false
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
        case "next":
            next = true
        default:
            break;
    }

    if (next) {
        let hostnames: string[] = []
        for (const hostname of scanAllServers(ns, true)) {
            if (hostname == "home" || hostname.startsWith(PURCHASED_SERVER_HOSTNAME)) {
                continue
            }

            const need = ns.getServerRequiredHackingLevel(hostname)
            if (need > ns.getHackingLevel()) {
                hostnames.push(hostname)
            }
        }

        const servers = sortServers(ns, "requiredHackingSkill", hostnames)
        for (const server of servers) {
            ns.tprint(`${server}: need ${ns.getServerRequiredHackingLevel(server)}`)
        }

    } else if (script !== '') {
        for (const server of getSwarm(ns)) {
            if (!home && server.hostname === "home") {
                !quiet && ns.tprint("...ignoring home")
                continue
            } else if (!purchased && server.hostname.startsWith(PURCHASED_SERVER_HOSTNAME)) {
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
    } else {
        ns.tprint("nothing to do")
    }
}
