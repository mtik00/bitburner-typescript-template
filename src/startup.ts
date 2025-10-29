
import { NS } from "@ns";
import { execHack, scanAllServers, openServer, sortServers } from './helpers.js'
import { createFlagAutocomplete, waitForPID } from "./helpersScriptInterface.js";

const SINGULARITY = true

interface FlagsSchema {
  script: string;
  target: string;
}

const argsSchema: [string, string | number | boolean | string[]][] = [
  ['target', ''],
  ['script', 'v1-hack.js'],
]

export function autocomplete(data: any, args: any) {
  return createFlagAutocomplete({
    "--target": (data: any) => data.servers,
    "--script": (data: any) => data.scripts,
  })(data, args);
}

export async function main(ns: NS): Promise<void> {
  const options = ns.flags(argsSchema) as unknown as FlagsSchema

  if (options.target === '') {
    ns.tprint("USAGE: ./startup.js --target <hostname>")
    return
  }

  if (SINGULARITY) {
    const pid = ns.exec("singluarityStartup.js", "home")
    waitForPID(ns, pid)
  }

  // Make sure the target is open before we start to hack it.
  openServer(ns, options.target)
  ns.nuke(options.target)

  const servers = sortServers(ns, "requiredHackingSkill", scanAllServers(ns));
  for (let i = 0; i < servers.length; ++i) {
    execHack(ns, options.target, options.script, false, servers[i], undefined, undefined, true);
  }
}
