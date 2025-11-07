import { NS } from "@ns";
import { createFlagAutocomplete } from "./autocomplete";

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
  ['target', ''],
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

export async function main(ns: NS): Promise<void> {
  const options = ns.flags(argsSchema) as unknown as FlagsSchema

  if (options.help) {
    help(ns)
    return
  } else if (options.target === '') {
    ns.tprint(`USAGE: ${ns.getScriptName()} --target <hostname>`)
    return
  }

  ns.tprint("Hello Remote API!");
}
