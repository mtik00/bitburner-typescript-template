import {execHack, scanAllServers} from './helpers.js'

export async function main(ns) {
    let hack_script = "v1-hack.js";
    if (ns.args.length > 0) {
      hack_script = ns.args[0];
    }

    const servers = scanAllServers(ns);
    for (let i = 0; i < servers.length; ++i) {
        execHack(ns, servers[i], hack_script);
    }
}
