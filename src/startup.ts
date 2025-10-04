// @ts-nocheck
import { NS } from "@ns";
import { execHack, scanAllServers } from './helpers.js'

export async function main(ns: NS): Promise<void> {
  const options = ns.flags([['script', 'v1-hack.js']]);

  if (typeof options.script !== "string") {
    ns.tprintf("Invalid options.script: %s", options.script);
    return;
  }

  const servers = scanAllServers(ns);
  for (let i = 0; i < servers.length; ++i) {
    execHack(ns, servers[i], options.script);
  }
}
