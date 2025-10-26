// @ts-nocheck
import { NS } from "@ns";
import { getThreads, scanAllServers } from './helpers.js'

export async function main(ns: NS): Promise<void> {
  const options = ns.flags([
    ['target', ''],
    ['script', 'hWeaken.js'],
  ]);

  if (options.target === '') {
    ns.tprint("USAGE: ./startup.js --target <hostname>")
    return
  }

  const servers = scanAllServers(ns);
  for (let i = 0; i < servers.length; ++i) {
    const hostServer = servers[i]
    const threads = getThreads(ns, options.script, hostServer, undefined, true)
    if (threads < 1) {
      continue
    }

    ns.killall(hostServer, true)
    ns.scp(options.script, hostServer)
    ns.exec(options.script, hostServer, threads, "--target", options.target, "--loop");
    ns.tprintf("executed %s on %s with -t=%s", options.script, hostServer, threads);
  }
}
