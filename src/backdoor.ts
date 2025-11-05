import { NS } from "@ns";
import { findPath } from "./lib/path";
import { filterHackableServers } from "./lib/autocomplete";

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0];
  if (target === undefined) {
    return
  }

  const hackSkill = ns.getHackingLevel()
  const hackRequired = ns.getServerRequiredHackingLevel(target.toString())
  if (hackSkill < hackRequired) {
    ns.print(`can't hack ${target} yet`)
    return
  }

  const [results, isFound] = findPath(ns, target.toString(), "home", [], [], false)
  if (!isFound) {
    ns.tprintf("%s not found", target)
    return
  }

  ns.tprintf("Connecting to %s though: %s", target, results)

  for (const server of results) {
    ns.tprint("...connecting to ", server)
    await ns.singularity.connect(server)
  }

  ns.tprintf("Installing backdoor on %s...", target)
  try {
    await ns.singularity.installBackdoor()
  } catch (error) {
    ns.tprint(`Error while calling backdoor: ${error}`)
  }
  ns.singularity.connect("home")
  ns.tprint("...done")

}

export function autocomplete(data: any, args: any) {
  return filterHackableServers(data);
}
