
import { NS } from "@ns";
import { execHack, scanAllServers, openServer, sortServers } from './helpers.js'
import { createFlagAutocomplete, waitForPIDComplete } from "./helpersScriptInterface.js";

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

/**
 * A script to use singularity functions to automate game startup.
 * 
 * @param ns 
 */
async function singularityStartup(ns: NS) {
  const freeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home")
  const costRam = ns.getScriptRam("singularityStartup.js", "home")

  if (freeRam >= costRam) {
    const pid = ns.exec("singularityStartup.js", "home")
    if (pid > 0) {
      // ns.ui.openTail(pid)
      await waitForPIDComplete(ns, pid)
    } else {
      ns.tprint("ERROR: Could not start singularityStartup.js")
    }
  } else {
    ns.tprint("WARN: Not enough free ram to run singularityStartup.js")
  }
}

export async function main(ns: NS): Promise<void> {
  const options = ns.flags(argsSchema) as unknown as FlagsSchema

  if (options.target === '') {
    ns.tprint("USAGE: ./startup.js --target <hostname>")
    return
  }

  SINGULARITY && await singularityStartup(ns)

  // Make sure the target is open before we start to hack it.
  if (openServer(ns, options.target, undefined, true)) {
    ns.nuke(options.target)
  }

  const servers = sortServers(ns, "requiredHackingSkill", scanAllServers(ns));
  for (let i = 0; i < servers.length; ++i) {
    execHack(ns, options.target, options.script, false, servers[i], undefined, undefined, true);
  }
}
