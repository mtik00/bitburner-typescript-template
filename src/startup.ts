// @ts-nocheck
import { NS } from "@ns";
import { execHack, scanAllServers, openServer, sortServers, createFlagAutocomplete } from './helpers.js'

export async function main(ns: NS): Promise<void> {
  const options = ns.flags([
    ['target', ''],
    ['script', 'v1-hack.js'],
  ]);

  if (options.target === '') {
    ns.tprint("USAGE: ./startup.js --target <hostname>")
    return
  }

  // Make sure the target is open before we start to hack it.
  const target = options.target.toString()
  openServer(ns, target)
  ns.nuke(target)

  const servers = sortServers(ns, "requiredHackingSkill", scanAllServers(ns));
  for (let i = 0; i < servers.length; ++i) {
    execHack(ns, options.target, options.script, false, servers[i], undefined, undefined, true);
  }
}

export function autocomplete(data: any, args: any) {
  return createFlagAutocomplete({
    "--target": (data: any) => data.servers,
    "--script": (data: any) => data.scripts,
  })(data, args);
}
