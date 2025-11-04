import { NS } from "@ns";
import { createFlagAutocomplete } from "./helpersScriptInterface";
import { waitForPIDComplete } from "./helpersScriptInterface";
import { openServer, sortServers, scanAllServers, execHack } from "./helpers";

const SINGULARITY = true

/* Define the script interface ***********************************************/
function help(ns: NS) {
  ns.tprint("This script is used to....")
  ns.tprint("parameters:")
  ns.tprint("  --target <hostname>: Requried; the name of the server to target")
  ns.tprint("  --script <script>: Optional; the name of the script to run.  Defaults to 'v1-hack.js'")
  ns.tprint(`USAGE: ${ns.getScriptName()} --target <hostname>`)
}

interface FlagsSchema {
  script: string
  target: string
  help: boolean
}

const argsSchema: [string, string | number | boolean | string[]][] = [
  ['target', 'joesguns'],
  ['script', 'v1-hack.js'],
  ['help', false],
]

export function autocomplete(data: any, args: any) {
  return createFlagAutocomplete({
    "--target": (data: any) => data.servers,
    "--script": (data: any) => data.scripts,
  })(data, args);
}
/* ***************************************************************************/

/**
 * A script to use singularity functions to automate game startup.
 * 
 * @param ns 
 */
async function singularityStartup(ns: NS) {
  const freeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home")
  const costRam = ns.getScriptRam("singularityStartup.js", "home")

  if (freeRam >= costRam) {
    const pid = ns.exec("singularityStartup.js", "home", { preventDuplicates: true })
    if (pid > 0) {
      // ns.ui.openTail(pid)
      await waitForPIDComplete(ns, pid)
    } else {
      ns.print("ERROR: Could not start singularityStartup.js")
    }
  } else {
    ns.print("WARN: Not enough free ram to run singularityStartup.js")
  }
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL")
  const options = ns.flags(argsSchema) as unknown as FlagsSchema

  if (options.help) {
    help(ns)
    return
  } else if (options.target === '') {
    ns.tprint(`USAGE: ${ns.getScriptName()} --target <hostname>`)
    return
  }

  while (true) {
    SINGULARITY && await singularityStartup(ns)

    // Make sure the target is open before we start to hack it.
    if (openServer(ns, options.target, undefined, true)) {
      ns.nuke(options.target)
    }

    // Look for new servers
    const servers = sortServers(ns, "requiredHackingSkill", scanAllServers(ns));
    for (let i = 0; i < servers.length; ++i) {
      execHack(ns, options.target, options.script, false, servers[i], undefined, undefined, true);
    }

    ns.print("...waiting 10 seconds")
    await ns.asleep(10000)
  }
}
