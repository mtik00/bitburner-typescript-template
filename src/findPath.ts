import { NS } from "@ns";
import { findPath } from "helpers"

export async function main(ns: NS) {
    let startServer = ns.getHostname();
    let target = ns.args[0];
    if (target === undefined) {
        ns.alert('Please provide target server');
        return;
    }
    let [results, isFound] = findPath(ns, target.toString(), startServer, [], [], false);
    if (!isFound) {
        ns.alert('Server not found!');
    } else {
        for (const host in results) {
            ns.tprintf("connect %s;", results[host])
        }
    }
}
