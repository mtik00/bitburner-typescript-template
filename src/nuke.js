const argsSchema = [
    ['target', ''],
];

/** @param {NS} ns */
export async function main(ns) {
    const options = ns.flags(argsSchema);

    if (options.target.length === 0) {
        ns.tprint("USAGE: hack --target <target>");
        return
    }

    ns.nuke(options.target);
}
