// @ts-nocheck
import { NS } from "@ns";
import { execHack, scanAllServers } from './helpers.js'

export async function main(ns: NS): Promise<void> {
  const options = ns.flags([
    ['target', ''],
    ['script', 'v1-hack.js'],
  ]);

  if (options.target === '') {
    ns.tprint("USAGE: ./startup.js --target <hostname>")
    return
  }

  const servers = scanAllServers(ns);
  for (let i = 0; i < servers.length; ++i) {
    execHack(ns, options.target, options.script, false, servers[i]);
  }
}
