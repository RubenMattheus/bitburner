import { NS } from "@ns";
import { scanServers } from "../servers/server-scan";

const scriptBase = "/scripts/hacking/actions/";
const shareServers = ["server_21", "server_22", "server_23", "server_24", "server_25"];

/**
 * Orchestrator function that manages the deployment of hacking scripts across servers with root access.
 *
 * It scans for servers, determines the optimal action for each target server, and executes the necessary scripts to weaken, grow, or hack the targets.
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function deploy(ns: NS) {
	const servers = scanServers(ns)["hasRootAccess"];
	servers.push(servers.splice(servers.indexOf("home"), 1)[0]); // put home at end of servers array

	const targets = servers.filter(
		(a) =>
			ns.getServerMaxMoney(a) != 0 &&
			ns.getServerRequiredHackingLevel(a) < ns.getHackingLevel() / 2,
	);

	// calculate needed threads and optimal action for targets
	for (let target of targets) {
		const hackPerc = Math.min(
			ns.getHackingLevel() / 13.33 / ns.getServerRequiredHackingLevel(target),
			0.75,
		); // scales from 0.15 at 2x required hacking level to 0.75 at 10x required hacking level

		// skip target if scripts were deployed in a previous run to prevent overlaps
		const inProgress = servers.some(
			(host) =>
				ns.isRunning(scriptBase + "weaken.js", host, target) ||
				ns.isRunning(scriptBase + "grow.js", host, target) ||
				ns.isRunning(scriptBase + "hack.js", host, target),
		);
		if (inProgress) continue;

		// define current and target values
		const currentMoney = ns.getServerMoneyAvailable(target);
		const currentSecurity = ns.getServerSecurityLevel(target);

		const moneyTarget = ns.getServerMaxMoney(target) * 0.95;
		const securityTarget = ns.getServerMinSecurityLevel(target) * 1.25;

		// calculate needed threads for required action
		const weakenThreads = Math.ceil(
			(currentSecurity - securityTarget) / ns.weakenAnalyze(1),
		);
		let growThreads = 5;
		if (currentMoney != 0) {
			growThreads = Math.ceil(
				ns.growthAnalyze(target, ns.getServerMaxMoney(target) / currentMoney),
			);
		}
		const hackThreads = Math.ceil(hackPerc / ns.hackAnalyze(target));

		// execute action on available host servers
		if (currentSecurity > securityTarget && weakenThreads > 0) {
			execute(ns, "weaken", target, weakenThreads);
		} else if (currentMoney < moneyTarget && growThreads > 0) {
			execute(ns, "grow", target, growThreads);
		} else if (hackThreads > 0) {
			execute(ns, "hack", target, hackThreads);
		}
	}

	// use free RAM on servers
	for (let server of servers.filter((a) => a != "home")) {
		let scriptPath = "";
		if (shareServers.includes(server)) {
			let scriptPath = scriptBase + "share.js";
		} else {
			let scriptPath = scriptBase + "xp.js";
		}

		const scriptRam = ns.getScriptRam(scriptPath);

		if (!ns.fileExists(scriptPath, server)) {
			ns.scp(scriptPath, server);
		}

		const threads = Math.floor(
			(ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / scriptRam,
		);

		if (threads > 0) {
			ns.exec(scriptPath, server, threads);
		}
	}
}

/**
 * Execute scripts on servers with root access to perform a specified action on a target server.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} action - The action to execute ("weaken", "grow", or "hack").
 * @param {string} target - The target server for the action.
 * @param {number} totalNeededThreads - The total number of threads needed for the action.
 */
function execute(ns: NS, action: string, target: string, totalNeededThreads: number) {
	const scriptPath = scriptBase + action + ".js";
	const scriptRam = ns.getScriptRam(scriptPath);
	let neededThreads = totalNeededThreads;

	const servers = scanServers(ns)["hasRootAccess"];
	servers.push(servers.splice(servers.indexOf("home"), 1)[0]); // put home at end of servers array

	for (let host of servers) {
		ns.scriptKill(scriptBase + "xp.js", host);
		const availableRam =
			(host != "home"
				? ns.getServerMaxRam(host)
				: ns.getServerMaxRam(host) - 64) - ns.getServerUsedRam(host);
		const hostCores = ns.getServer(host).cpuCores;

		if (neededThreads > 0) {
			if (!ns.fileExists(scriptPath, host)) {
				ns.scp(scriptPath, host);
			}

			const availableThreads = Math.floor(availableRam / scriptRam);
			const deployedThreads = Math.min(
				Math.floor(neededThreads / hostCores),
				availableThreads,
			);

			if (deployedThreads <= 0) {
				continue;
			} else {
				ns.exec(scriptPath, host, deployedThreads, target);
				neededThreads -= deployedThreads * hostCores;
			}
		} else return; // no more scripts need to be ran for this target
	}
}
