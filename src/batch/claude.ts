import { NS } from "@ns";
import { waitForPIDComplete } from "/lib/scripting";

interface Target {
    hostname: string;
    score: number;
    maxMoney: number;
    hackTime: number;
    growTime: number;
    weakenTime: number;
    hackChance: number;
    requiredLevel: number;
}

interface Batch {
    id: number;
    target: string;
    launchTime: number;
    finishTime: number;
    operations: BatchOperation[];
}

interface BatchOperation {
    type: "hack" | "weaken1" | "grow" | "weaken2";
    threads: number;
    delay: number;
    server: string;
}

type Mode = "money" | "exp" | "balanced";

const SINGULARITY_SCRIPT = "singularityStartup.js";
const BATCH_SPACING = 200; // ms between batch finish times
const OPERATION_SPACING = 50; // ms between operations within a batch
const REDEPLOY_LEVEL_THRESHOLD = 10; // Redeploy when gaining this many hacking levels

async function singularityStartup(ns: NS): Promise<void> {
    if (!ns.fileExists(SINGULARITY_SCRIPT, "home")) {
        ns.tprint(`WARN: ${SINGULARITY_SCRIPT} not found, skipping singularity startup...`);
        return;
    }

    const freeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
    const costRam = ns.getScriptRam(SINGULARITY_SCRIPT, "home");

    if (freeRam >= costRam) {
        ns.print(`INFO: Starting ${SINGULARITY_SCRIPT}...`);
        const pid = ns.exec(SINGULARITY_SCRIPT, "home");
        if (pid > 0) {
            await waitForPIDComplete(ns, pid);
            ns.print(`INFO: ${SINGULARITY_SCRIPT} completed successfully`);
        } else {
            ns.tprint(`ERROR: Could not start ${SINGULARITY_SCRIPT}`);
        }
    } else {
        ns.tprint(`WARN: Not enough free RAM to run ${SINGULARITY_SCRIPT}`);
    }
}

export async function main(ns: NS): Promise<void> {
    const MODE = (ns.args[0] as Mode) || "balanced";
    const ENABLE_SINGULARITY = ns.args[1] === "singularity" || ns.args[1] === true || false;
    const ENABLE_BATCHING = MODE === "money";
    const CHECK_INTERVAL = 1000;

    ns.disableLog("ALL");
    ns.clearLog();
    ns.ui.openTail();

    await createWorkerScripts(ns, ENABLE_BATCHING);

    ns.print(`INFO: Starting hack controller in ${MODE.toUpperCase()} mode`);
    ns.print(`INFO: Batching: ${ENABLE_BATCHING ? "ENABLED" : "DISABLED"}`);

    let lastHackingLevel = ns.getHackingLevel();
    let lastServerCount = 0;
    let currentTargets: Target[] = [];
    let activeBatches: Batch[] = [];
    let batchIdCounter = 0;

    if (ENABLE_SINGULARITY) {
        await singularityStartup(ns);
    }

    // Initial deployment
    ns.print("═══ INITIAL DEPLOYMENT ═══");
    if (ENABLE_BATCHING) {
        currentTargets = getCurrentTargets(ns, MODE);
        if (currentTargets.length > 0) {
            await prepareTargetForBatching(ns, currentTargets[0]);
        }
    } else {
        await fullRedeploy(ns, MODE);
        currentTargets = getCurrentTargets(ns, MODE);
    }
    lastServerCount = getAllServers(ns).filter(s => ns.hasRootAccess(s)).length;
    ns.print("═══ DEPLOYMENT COMPLETE ═══");

    let loopCount = 0;
    while (true) {
        try {
            loopCount++;
            const currentLevel = ns.getHackingLevel();
            const currentServerCount = getAllServers(ns).filter(s => ns.hasRootAccess(s)).length;

            let needsRedeploy = false;
            let redeployReason = "";

            if (currentLevel >= lastHackingLevel + REDEPLOY_LEVEL_THRESHOLD) {
                needsRedeploy = true;
                redeployReason = `Hacking level: ${lastHackingLevel} → ${currentLevel}`;
                lastHackingLevel = currentLevel;
            }

            if (currentServerCount > lastServerCount) {
                needsRedeploy = true;
                redeployReason = `New servers: ${lastServerCount} → ${currentServerCount}`;
                lastServerCount = currentServerCount;
            }

            if (needsRedeploy) {
                ns.print(`═══ REDEPLOYING: ${redeployReason} ═══`);
                killAllWorkers(ns);
                activeBatches = [];
                batchIdCounter = 0;

                if (ENABLE_BATCHING) {
                    currentTargets = getCurrentTargets(ns, MODE);
                    if (currentTargets.length > 0) {
                        await prepareTargetForBatching(ns, currentTargets[0]);
                    }
                } else {
                    await fullRedeploy(ns, MODE);
                    currentTargets = getCurrentTargets(ns, MODE);
                }
                ns.print(`═══ REDEPLOY COMPLETE ═══`);
            }

            // Launch new batches if in batching mode
            if (ENABLE_BATCHING && currentTargets.length > 0) {
                const target = currentTargets[0];

                // Check if target needs reprep
                const currentSec = ns.getServerSecurityLevel(target.hostname);
                const minSec = ns.getServerMinSecurityLevel(target.hostname);
                const currentMoney = ns.getServerMoneyAvailable(target.hostname);
                const maxMoney = target.maxMoney;

                if (currentSec > minSec + 2 || currentMoney < maxMoney * 0.9) {
                    ns.print(`Target ${target.hostname} drifted (Sec=${currentSec.toFixed(1)}/${minSec}, Money=${(currentMoney / maxMoney * 100).toFixed(1)}%), repropping...`);
                    killAllWorkers(ns);
                    activeBatches = [];
                    await prepareTargetForBatching(ns, target);
                } else {
                    const newBatch = await tryLaunchBatch(ns, target, batchIdCounter, activeBatches);
                    if (newBatch) {
                        activeBatches.push(newBatch);
                        const totalOps = newBatch.operations.length;
                        const hackOps = newBatch.operations.filter(o => o.type === "hack").reduce((sum, o) => sum + o.threads, 0);
                        const w1Ops = newBatch.operations.filter(o => o.type === "weaken1").reduce((sum, o) => sum + o.threads, 0);
                        const growOps = newBatch.operations.filter(o => o.type === "grow").reduce((sum, o) => sum + o.threads, 0);
                        const w2Ops = newBatch.operations.filter(o => o.type === "weaken2").reduce((sum, o) => sum + o.threads, 0);
                        const serversUsed = new Set(newBatch.operations.map(o => o.server)).size;
                        ns.print(`Batch ${batchIdCounter}: H=${hackOps}t, W1=${w1Ops}t, G=${growOps}t, W2=${w2Ops}t on ${serversUsed} servers`);
                        batchIdCounter++;
                    } else if (loopCount % 10 === 0) {
                        // Only log occasionally to avoid spam
                        ns.print(`Cannot launch batch: target state or RAM insufficient`);
                    }
                }
            }

            const now = Date.now();
            activeBatches = activeBatches.filter(b => b.finishTime > now);

            displayStatus(ns, currentTargets, MODE, lastHackingLevel, currentServerCount, loopCount, activeBatches);

            await ns.sleep(CHECK_INTERVAL);
        } catch (error) {
            ns.print(`ERROR: ${error}`);
            await ns.sleep(5000);
        }
    }
}

async function prepareTargetForBatching(ns: NS, target: Target): Promise<void> {
    const hostname = target.hostname;
    const minSec = ns.getServerMinSecurityLevel(hostname);
    const maxMoney = ns.getServerMaxMoney(hostname);

    ns.print(`Preparing ${hostname} for batching...`);
    ns.print(`  Current: Sec=${ns.getServerSecurityLevel(hostname).toFixed(2)}, Money=${ns.formatNumber(ns.getServerMoneyAvailable(hostname))}`);
    ns.print(`  Target: Sec=${minSec}, Money=${ns.formatNumber(maxMoney)}`);

    const allServers = getAllServers(ns);
    const workers = allServers.filter(s => ns.hasRootAccess(s));

    // Debug: Show server info
    let totalRam = 0;
    let homeRam = 0;
    for (const server of workers) {
        const ram = getAvailableRam(ns, server);
        totalRam += ram;
        if (server === "home") homeRam = ram;
    }
    ns.print(`  Workers: ${workers.length} servers, ${ns.formatRam(totalRam)} total RAM (home: ${ns.formatRam(homeRam)})`);

    // Weaken to minimum security
    let iterations = 0;
    const maxWeakenIterations = 50;
    while (ns.getServerSecurityLevel(hostname) > minSec + 0.5 && iterations < maxWeakenIterations) {
        iterations++;

        killAllWorkers(ns);
        await ns.sleep(500);  // Give more time for scripts to actually terminate

        let weakenThreadsLaunched = 0;
        const weakenRam = ns.getScriptRam("basic-weaken.js");

        // Calculate based on MAX RAM since we just killed everything
        for (const server of workers) {
            let maxRam = ns.getServerMaxRam(server);

            // Reserve RAM on home
            if (server === "home") {
                maxRam -= Math.min(32, maxRam * 0.1);
            }

            const threads = Math.floor(maxRam / weakenRam);

            if (threads > 0) {
                ns.exec("basic-weaken.js", server, threads, hostname, Date.now());
                weakenThreadsLaunched += threads;
            }
        }

        const currentSec = ns.getServerSecurityLevel(hostname);
        const weakenTime = ns.getWeakenTime(hostname);
        ns.print(`  Weaken ${iterations}/${maxWeakenIterations}: ${weakenThreadsLaunched}t, Sec=${currentSec.toFixed(2)}/${minSec}, Wait=${(weakenTime / 1000).toFixed(1)}s`);

        await ns.sleep(weakenTime + 1000);
    }

    killAllWorkers(ns);
    await ns.sleep(100);

    // Grow to maximum money
    iterations = 0;
    const maxGrowIterations = 50;
    while (ns.getServerMoneyAvailable(hostname) < maxMoney * 0.98 && iterations < maxGrowIterations) {
        iterations++;

        let growThreadsLaunched = 0;
        let weakenThreadsLaunched = 0;
        const growRam = ns.getScriptRam("basic-grow.js");
        const weakenRam = ns.getScriptRam("basic-weaken.js");

        // Calculate how many grow threads we can afford based on MAX RAM
        let totalGrowThreads = 0;
        for (const server of workers) {
            let maxRam = ns.getServerMaxRam(server);
            if (server === "home") {
                maxRam -= Math.min(32, maxRam * 0.1);
            }
            totalGrowThreads += Math.floor(maxRam * 0.5 / growRam);
        }

        // Calculate weaken threads needed (grow = 0.004 sec, weaken = 0.05 sec)
        const growSecIncrease = totalGrowThreads * 0.004;
        const weakenThreadsNeeded = Math.ceil(growSecIncrease / 0.05);

        for (const server of workers) {
            let maxRam = ns.getServerMaxRam(server);
            if (server === "home") {
                maxRam -= Math.min(32, maxRam * 0.1);
            }

            const growThreads = Math.floor(maxRam * 0.5 / growRam);
            const ramAfterGrow = maxRam - (growThreads * growRam);
            const weakenThreads = Math.floor(ramAfterGrow / weakenRam);

            if (growThreads > 0) {
                ns.exec("basic-grow.js", server, growThreads, hostname, Date.now());
                growThreadsLaunched += growThreads;
            }
            if (weakenThreads > 0) {
                ns.exec("basic-weaken.js", server, weakenThreads, hostname, Date.now() + 1);
                weakenThreadsLaunched += weakenThreads;
            }
        }

        const currentMoney = ns.getServerMoneyAvailable(hostname);
        const currentSec = ns.getServerSecurityLevel(hostname);
        const growTime = ns.getGrowTime(hostname);
        const weakenTime = ns.getWeakenTime(hostname);
        const expectedSecIncrease = growThreadsLaunched * 0.004;
        const expectedSecDecrease = weakenThreadsLaunched * 0.05;
        const netSecChange = expectedSecIncrease - expectedSecDecrease;
        ns.print(`  Grow ${iterations}/${maxGrowIterations}: G=${growThreadsLaunched}t W=${weakenThreadsLaunched}t, Money=${ns.formatNumber(currentMoney)}/${ns.formatNumber(maxMoney)}, Sec=${currentSec.toFixed(2)}, NetSec=${netSecChange.toFixed(2)}, GrowWait=${(growTime / 1000).toFixed(1)}s, WeakenWait=${(weakenTime / 1000).toFixed(1)}s`);

        // CRITICAL: Wait for the LONGER of grow or weaken to complete!
        const maxTime = Math.max(growTime, weakenTime);
        await ns.sleep(maxTime + 1000);

        killAllWorkers(ns);
        await ns.sleep(500);
    }

    const finalSec = ns.getServerSecurityLevel(hostname);
    const finalMoney = ns.getServerMoneyAvailable(hostname);
    ns.print(`Prep complete: Sec=${finalSec.toFixed(2)}/${minSec}, Money=${ns.formatNumber(finalMoney)}/${ns.formatNumber(maxMoney)}`);

    if (finalSec > minSec + 5) {
        ns.print(`ERROR: Prep failed - security still too high (${finalSec.toFixed(2)}/${minSec})`);
        ns.print(`This may indicate interference from other scripts or insufficient threads.`);
    }

    if (finalMoney < maxMoney * 0.9) {
        ns.print(`WARN: Prep incomplete - money at ${(finalMoney / maxMoney * 100).toFixed(1)}%`);
    }

    killAllWorkers(ns);
    await ns.sleep(500);
}

async function tryLaunchBatch(ns: NS, target: Target, batchId: number, activeBatches: Batch[]): Promise<Batch | null> {
    const hostname = target.hostname;

    const currentSec = ns.getServerSecurityLevel(hostname);
    const minSec = ns.getServerMinSecurityLevel(hostname);
    const currentMoney = ns.getServerMoneyAvailable(hostname);
    const maxMoney = target.maxMoney;

    if (currentSec > minSec + 1 || currentMoney < maxMoney * 0.95) {
        return null;
    }

    const hackTime = ns.getHackTime(hostname);
    const growTime = ns.getGrowTime(hostname);
    const weakenTime = ns.getWeakenTime(hostname);

    const batchFinishTime = Date.now() + weakenTime;

    const lastBatchFinish = activeBatches.length > 0
        ? Math.max(...activeBatches.map(b => b.finishTime))
        : Date.now();

    if (batchFinishTime < lastBatchFinish + BATCH_SPACING) {
        return null;
    }

    const hackDelay = weakenTime - hackTime;
    const weaken1Delay = OPERATION_SPACING;
    const growDelay = weakenTime - growTime + OPERATION_SPACING * 2;
    const weaken2Delay = OPERATION_SPACING * 3;

    // Steal only 10% to minimize security drift
    const hackPercent = 0.10;
    const hackThreadsNeeded = Math.max(1, Math.floor(ns.hackAnalyzeThreads(hostname, maxMoney * hackPercent)));
    const hackSecurityIncrease = ns.hackAnalyzeSecurity(hackThreadsNeeded, hostname);

    const growThreadsNeeded = Math.max(1, Math.ceil(ns.growthAnalyze(hostname, maxMoney / (maxMoney - maxMoney * hackPercent))));
    const growSecurityIncrease = ns.growthAnalyzeSecurity(growThreadsNeeded, hostname);

    const weaken1ThreadsNeeded = Math.ceil(hackSecurityIncrease / 0.05);
    const weaken2ThreadsNeeded = Math.ceil(growSecurityIncrease / 0.05);

    const allServers = getAllServers(ns);
    const workers = allServers.filter(s => ns.hasRootAccess(s));

    const hackRam = ns.getScriptRam("basic-hack.js");
    const growRam = ns.getScriptRam("basic-grow.js");
    const weakenRam = ns.getScriptRam("basic-weaken.js");

    // Calculate total RAM reserved by active batches per server
    const reservedRam: Map<string, number> = new Map();
    for (const batch of activeBatches) {
        for (const op of batch.operations) {
            const current = reservedRam.get(op.server) || 0;
            const opRam = op.type === "hack" ? hackRam :
                op.type === "grow" ? growRam : weakenRam;
            reservedRam.set(op.server, current + (op.threads * opRam));
        }
    }

    const ramNeeded = hackThreadsNeeded * hackRam +
        weaken1ThreadsNeeded * weakenRam +
        growThreadsNeeded * growRam +
        weaken2ThreadsNeeded * weakenRam;

    // Calculate total available RAM (max - reserved by active batches)
    let totalAvailableRam = 0;
    for (const server of workers) {
        let maxRam = ns.getServerMaxRam(server);
        if (server === "home") {
            maxRam -= Math.min(32, maxRam * 0.1);
        }
        const reserved = reservedRam.get(server) || 0;
        const available = maxRam - reserved;
        totalAvailableRam += Math.max(0, available);
    }

    if (totalAvailableRam < ramNeeded) {
        return null;
    }

    const batch: Batch = {
        id: batchId,
        target: hostname,
        launchTime: Date.now(),
        finishTime: batchFinishTime + OPERATION_SPACING * 3,
        operations: []
    };

    let hackThreadsRemaining = hackThreadsNeeded;
    let weaken1ThreadsRemaining = weaken1ThreadsNeeded;
    let growThreadsRemaining = growThreadsNeeded;
    let weaken2ThreadsRemaining = weaken2ThreadsNeeded;

    for (const server of workers) {
        let maxRam = ns.getServerMaxRam(server);
        if (server === "home") {
            maxRam -= Math.min(32, maxRam * 0.1);
        }
        const reserved = reservedRam.get(server) || 0;
        let ram = maxRam - reserved;  // Changed to let so we can update it

        if (ram < 2) continue;

        if (hackThreadsRemaining > 0) {
            const threads = Math.min(hackThreadsRemaining, Math.floor(ram / hackRam));
            if (threads > 0) {
                ns.exec("basic-hack.js", server, threads, hostname, batchId, hackDelay);
                batch.operations.push({ type: "hack", threads, delay: hackDelay, server });
                hackThreadsRemaining -= threads;
                ram -= threads * hackRam;  // Update remaining RAM
            }
        }

        if (weaken1ThreadsRemaining > 0 && ram >= weakenRam) {
            const threads = Math.min(weaken1ThreadsRemaining, Math.floor(ram / weakenRam));
            if (threads > 0) {
                ns.exec("basic-weaken.js", server, threads, hostname, batchId, weaken1Delay);
                batch.operations.push({ type: "weaken1", threads, delay: weaken1Delay, server });
                weaken1ThreadsRemaining -= threads;
                ram -= threads * weakenRam;  // Update remaining RAM
            }
        }

        if (growThreadsRemaining > 0 && ram >= growRam) {
            const threads = Math.min(growThreadsRemaining, Math.floor(ram / growRam));
            if (threads > 0) {
                ns.exec("basic-grow.js", server, threads, hostname, batchId, growDelay);
                batch.operations.push({ type: "grow", threads, delay: growDelay, server });
                growThreadsRemaining -= threads;
                ram -= threads * growRam;  // Update remaining RAM
            }
        }

        if (weaken2ThreadsRemaining > 0 && ram >= weakenRam) {
            const threads = Math.min(weaken2ThreadsRemaining, Math.floor(ram / weakenRam));
            if (threads > 0) {
                ns.exec("basic-weaken.js", server, threads, hostname, batchId, weaken2Delay);
                batch.operations.push({ type: "weaken2", threads, delay: weaken2Delay, server });
                weaken2ThreadsRemaining -= threads;
                ram -= threads * weakenRam;  // Update remaining RAM
            }
        }

        if (hackThreadsRemaining === 0 && weaken1ThreadsRemaining === 0 &&
            growThreadsRemaining === 0 && weaken2ThreadsRemaining === 0) {
            break;
        }
    }

    if (hackThreadsRemaining > 0 || weaken1ThreadsRemaining > 0 ||
        growThreadsRemaining > 0 || weaken2ThreadsRemaining > 0) {
        return null;
    }

    return batch;
}

function getAvailableRam(ns: NS, server: string): number {
    const maxRam = ns.getServerMaxRam(server);
    const usedRam = ns.getServerUsedRam(server);
    let available = maxRam - usedRam;

    if (server === "home") {
        available -= Math.min(32, maxRam * 0.1);
    }

    return Math.max(0, available);
}

function killAllWorkers(ns: NS): void {
    const allServers = getAllServers(ns);

    for (const server of allServers) {
        if (server === "home") {
            const procs = ns.ps(server);
            for (const proc of procs) {
                if (proc.pid !== ns.pid) {
                    ns.kill(proc.pid);
                }
            }
        } else if (ns.hasRootAccess(server)) {
            ns.killall(server);
        }
    }
}

function getAllServers(ns: NS): string[] {
    const servers = new Set<string>();
    const queue = ["home"];

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || servers.has(current)) continue;

        servers.add(current);
        const connected = ns.scan(current);
        queue.push(...connected.filter(s => !servers.has(s)));
    }

    return Array.from(servers);
}

function getCurrentTargets(ns: NS, mode: Mode): Target[] {
    const allServers = getAllServers(ns);
    const targetableServers = allServers.filter(s =>
        ns.hasRootAccess(s) &&
        ns.getServerMaxMoney(s) > 0 &&
        ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel()
    );

    return selectTargets(ns, targetableServers, mode);
}

function selectTargets(ns: NS, servers: string[], mode: Mode): Target[] {
    const targets: Target[] = [];

    for (const server of servers) {
        const maxMoney = ns.getServerMaxMoney(server);
        if (maxMoney === 0) continue;

        const hackTime = ns.getHackTime(server);
        const growTime = ns.getGrowTime(server);
        const weakenTime = ns.getWeakenTime(server);
        const hackChance = ns.hackAnalyzeChance(server);
        const hackPercent = ns.hackAnalyze(server);

        let score = 0;

        if (mode === "money") {
            const moneyPerSecond = (maxMoney * hackPercent * hackChance) / (hackTime / 1000);
            score = moneyPerSecond;
        } else if (mode === "exp") {
            const expPerSecond = ns.getServerRequiredHackingLevel(server) / (hackTime / 1000);
            score = expPerSecond * hackChance;
        } else {
            const moneyPerSecond = (maxMoney * hackPercent * hackChance) / (hackTime / 1000);
            const expPerSecond = ns.getServerRequiredHackingLevel(server) / (hackTime / 1000);
            score = (moneyPerSecond / 1000000) + expPerSecond;
        }

        targets.push({
            hostname: server,
            score: score,
            maxMoney: maxMoney,
            hackTime: hackTime,
            growTime: growTime,
            weakenTime: weakenTime,
            hackChance: hackChance,
            requiredLevel: ns.getServerRequiredHackingLevel(server)
        });
    }

    targets.sort((a, b) => b.score - a.score);

    const targetCount = mode === "money" ? Math.min(1, targets.length) :
        mode === "exp" ? Math.min(10, targets.length) :
            Math.min(5, targets.length);

    return targets.slice(0, targetCount);
}

async function fullRedeploy(ns: NS, mode: Mode): Promise<void> {
    const allServers = getAllServers(ns);
    const controlledServers = allServers.filter(s => ns.hasRootAccess(s) && s !== "home");
    const targets = getCurrentTargets(ns, mode);

    if (targets.length === 0) {
        ns.print("WARN: No valid targets found");
        return;
    }

    const HACK_RAM = ns.getScriptRam("basic-hack.js");
    const GROW_RAM = ns.getScriptRam("basic-grow.js");
    const WEAKEN_RAM = ns.getScriptRam("basic-weaken.js");

    for (const server of controlledServers) {
        await ns.scp(["basic-hack.js", "basic-grow.js", "basic-weaken.js"], server);
    }

    if (mode === "exp") {
        await distributeExpFocus(ns, controlledServers, targets, HACK_RAM, GROW_RAM, WEAKEN_RAM);
    } else {
        await distributeBalanced(ns, controlledServers, targets, HACK_RAM, GROW_RAM, WEAKEN_RAM);
    }
}

async function distributeExpFocus(
    ns: NS,
    servers: string[],
    targets: Target[],
    hackRam: number,
    growRam: number,
    weakenRam: number
): Promise<void> {
    let serverIndex = 0;

    for (const target of targets) {
        const hostname = target.hostname;

        for (let i = 0; i < Math.ceil(servers.length / targets.length); i++) {
            if (serverIndex >= servers.length) break;

            const server = servers[serverIndex];
            const ram = getAvailableRam(ns, server);

            if (ram < 2) {
                serverIndex++;
                continue;
            }

            const hackThreads = Math.floor(ram * 0.7 / hackRam);
            const growThreads = Math.floor(ram * 0.2 / growRam);
            const weakenThreads = Math.floor(ram * 0.1 / weakenRam);

            if (hackThreads > 0) ns.exec("basic-hack.js", server, hackThreads, hostname);
            if (growThreads > 0) ns.exec("basic-grow.js", server, growThreads, hostname);
            if (weakenThreads > 0) ns.exec("basic-weaken.js", server, weakenThreads, hostname);

            serverIndex++;
        }
    }
}

async function distributeBalanced(
    ns: NS,
    servers: string[],
    targets: Target[],
    hackRam: number,
    growRam: number,
    weakenRam: number
): Promise<void> {
    let serverIndex = 0;
    const serversPerTarget = Math.max(1, Math.floor(servers.length / targets.length));

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const hostname = target.hostname;
        const assignedServers = servers.slice(serverIndex, serverIndex + serversPerTarget);

        if (i === targets.length - 1) {
            assignedServers.push(...servers.slice(serverIndex + serversPerTarget));
        }

        for (const server of assignedServers) {
            const ram = getAvailableRam(ns, server);

            if (ram < 2) continue;

            const hackThreads = Math.floor(ram * 0.4 / hackRam);
            const growThreads = Math.floor(ram * 0.35 / growRam);
            const weakenThreads = Math.floor(ram * 0.25 / weakenRam);

            if (hackThreads > 0) ns.exec("basic-hack.js", server, hackThreads, hostname);
            if (growThreads > 0) ns.exec("basic-grow.js", server, growThreads, hostname);
            if (weakenThreads > 0) ns.exec("basic-weaken.js", server, weakenThreads, hostname);
        }

        serverIndex += serversPerTarget;
    }
}

function displayStatus(
    ns: NS,
    targets: Target[],
    mode: Mode,
    hackingLevel: number,
    serverCount: number,
    loopCount: number,
    activeBatches: Batch[]
): void {
    ns.clearLog();
    ns.print(`═══════════════════════════════════════════════`);
    ns.print(`  HACK CONTROLLER - ${mode.toUpperCase()} MODE`);
    if (mode === "money") {
        ns.print(`  BATCHING: ${activeBatches.length} active batches`);
    }
    ns.print(`═══════════════════════════════════════════════`);
    ns.print(`Loop: ${loopCount} | Hacking: ${hackingLevel} (redeploy: +${REDEPLOY_LEVEL_THRESHOLD})`);
    ns.print(`Servers: ${serverCount} | Targets: ${targets.length}`);
    ns.print(``);

    const income = ns.getTotalScriptIncome();
    ns.print(`Income: ${ns.formatNumber(income[0])}/sec`);
    ns.print(`Total: ${ns.formatNumber(income[1])}`);
    ns.print(``);

    ns.print(`Targets:`);
    for (let i = 0; i < Math.min(3, targets.length); i++) {
        const t = targets[i];
        const current = ns.getServerMoneyAvailable(t.hostname);
        const percent = (current / t.maxMoney * 100).toFixed(1);
        const sec = ns.getServerSecurityLevel(t.hostname).toFixed(1);
        const minSec = ns.getServerMinSecurityLevel(t.hostname).toFixed(1);

        ns.print(`  ${i + 1}. ${t.hostname}`);
        ns.print(`     $${ns.formatNumber(current)} (${percent}%) | Sec: ${sec}/${minSec}`);
    }
}

async function createWorkerScripts(ns: NS, batching: boolean): Promise<void> {
    if (batching) {
        const hackScript = `/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    const delay = ns.args[2] || 0;
    if (delay > 0) await ns.sleep(delay);
    await ns.hack(target);
}`;

        const growScript = `/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    const delay = ns.args[2] || 0;
    if (delay > 0) await ns.sleep(delay);
    await ns.grow(target);
}`;

        const weakenScript = `/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    const delay = ns.args[2] || 0;
    if (delay > 0) await ns.sleep(delay);
    await ns.weaken(target);
}`;

        await ns.write("basic-hack.js", hackScript, "w");
        await ns.write("basic-grow.js", growScript, "w");
        await ns.write("basic-weaken.js", weakenScript, "w");
    } else {
        const hackScript = `/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    while (true) {
        await ns.hack(target);
    }
}`;

        const growScript = `/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    while (true) {
        await ns.grow(target);
    }
}`;

        const weakenScript = `/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    while (true) {
        await ns.weaken(target);
    }
}`;

        await ns.write("basic-hack.js", hackScript, "w");
        await ns.write("basic-grow.js", growScript, "w");
        await ns.write("basic-weaken.js", weakenScript, "w");
    }
}
