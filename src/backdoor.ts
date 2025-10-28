import { NS } from "@ns";
import { findPath } from "./helpers";
import { filterHackableServers } from "./helpersScriptInterface";

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0];
  const [results, isFound] = findPath(ns, target.toString(), "home", [], [], false)
  if (!isFound) {
    ns.tprintf("%s not found", target)
    return
  }

  ns.tprintf("Connecting to %s though: %s", target, results)

  for (const server of results) {
    ns.tprint("...connecting to", server)
    await ns.singularity.connect(server)
  }

  ns.tprintf("Installing backdoor on %s...", target)
  await ns.singularity.installBackdoor()
  ns.tprint("...done")

  await ns.singularity.connect("home")
}

export function autocomplete(data: any, args: any) {
  return filterHackableServers(data);
}
