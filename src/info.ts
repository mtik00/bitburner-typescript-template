import { NS } from "@ns";
import { scanAllServers } from "./lib/scan";
import { PURCHASED_SERVER_HOSTNAME } from "./lib/const";
import { sortServers } from "./helpers";

function next_server(ns: NS) {
    // We need to get all hostnames since `scanAllServers` isn't sorted yet.
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

    if (hostnames.length === 0) {
        return {
            hostname: null,
            hackLevel: null,
        }
    }

    const servers = sortServers(ns, "requiredHackingSkill", hostnames)
    return {
        hostname: servers[0],
        hackLevel: ns.getServerRequiredHackingLevel(servers[0])
    }
}

export async function main(ns: NS): Promise<void> {
    ns.tprint("************** Game Info ********************")

    // Next server to open
    const nextServer = next_server(ns)
    if (nextServer.hostname) {
        ns.tprintf("Next server to hack: %s @ %s", nextServer.hostname, nextServer.hackLevel)
    } else {
        ns.tprint("...all servers hacked")
    }

    // Who's getting hacked, and how many threads
    // Next upgrade to purchased $$
    // Next upgrade to home $$
}
