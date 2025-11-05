import { NS } from "@ns";


export function findPath(
    ns: NS,
    target: string,
    serverName: string,
    serverList: string[],
    ignore: string[],
    isFound: boolean,
): [string[], boolean] {
    ignore.push(serverName);
    let scanResults = ns.scan(serverName);
    for (let server of scanResults) {
        if (ignore.includes(server)) {
            continue;
        }
        if (server === target) {
            serverList.push(server);
            return [serverList, true];
        }
        serverList.push(server);
        [serverList, isFound] = findPath(ns, target, server, serverList, ignore, isFound);
        if (isFound) {
            return [serverList, isFound];
        }
        serverList.pop();
    }
    return [serverList, false];
}

export async function connect(ns: NS, hostname: string, fromHost: string = "home"): Promise<void> {

    const [results, isFound] = findPath(ns, hostname, fromHost, [], [], false)
    if (!isFound) {
        ns.printf("%s not found", hostname)
        return
    }

    for (const hostname of results) {
        ns.tprint("...connecting to ", hostname)
        ns.singularity.connect(hostname)
    }
    ns.tprint("...done")
}
