import { NS } from "@ns";
import { findPath } from "./lib/path";
import { filterHackableServers } from "./lib/autocomplete";
import { backdoorServers } from "./lib/const";

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0];
  if (target === undefined) {
    ns.tprintf("USAGE: %s <hostname or 'all'>", ns.getScriptName())
    return
  }
  const arg = target.toString()
  let hostnames = new Set([arg])
  if (arg === "all") {
    hostnames = backdoorServers
  }

  let installed = 0

  for (const hostname of hostnames) {
    const hackSkill = ns.getHackingLevel()
    const hackRequired = ns.getServerRequiredHackingLevel(hostname)
    if (hackSkill < hackRequired) {
      ns.print(`can't hack ${hostname} yet`)
      continue
    }

    const [results, isFound] = findPath(ns, hostname, "home", [], [], false)
    if (!isFound) {
      ns.tprintf("%s not found", hostname)
      continue
    } else if (ns.getServer(hostname).backdoorInstalled) {
      continue
    }

    ns.tprintf("Connecting to %s though: %s", hostname, results)

    for (const server of results) {
      ns.tprint("...connecting to ", server)
      ns.singularity.connect(server)
    }

    ns.tprintf("Installing backdoor on %s...", hostname)
    try {
      await ns.singularity.installBackdoor()
      installed += 1
    } catch (error) {
      ns.tprint(`Error while calling backdoor: ${error}`)
    }
    ns.singularity.connect("home")
    ns.tprint("...done")
  }

  if (installed === 0) {
    ns.tprint("nothing to do")
  }
}

export function autocomplete(data: any, args: any) {
  return ["all", ...filterHackableServers(data)];
}
