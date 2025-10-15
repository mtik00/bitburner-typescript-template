// @ts-nocheck
import { NS } from "@ns";
import { execHack, scanAllServers, openServer } from './helpers.js'

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

  const servers = scanAllServers(ns);
  for (let i = 0; i < servers.length; ++i) {
    execHack(ns, options.target, options.script, false, servers[i]);
  }
}

export function autocomplete(data, args) {
  data.flags([
    ['target', ''],
    ['script', 'v1-hack.js'],
  ]);

  const lastFlag = args.length > 1 ? args[args.length - 2] : null;
  if (["--target"].includes(lastFlag))
    return data.servers;
  return [];
}
