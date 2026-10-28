import { NS } from "@ns";
import { scanServers } from "../servers/server-scan";

const SCRIPT_BASE = "/scripts/hacking/actions/";
const SHARE_SERVERS = ["server_21", "server_22", "server_23", "server_24", "server_25"];

export function deploy(ns: NS) {
	var servers = scanServers(ns)["hasRootAccess"];
	servers.push(servers.splice(servers.indexOf("home"), 1)[0]); // put home at end of servers array

	var targets = servers.filter(
		(a) =>
			ns.getServerMaxMoney(a) != 0 &&
			ns.getServerRequiredHackingLevel(a) < ns.getHackingLevel() / 2,
	);

	// calculate needed threads and optimal action for targets
	for (var target of targets) {
		var hack_perc = Math.min(
			ns.getHackingLevel() / 13.33 / ns.getServerRequiredHackingLevel(target),
			0.75,
		); // scales from 0.15 at 2x required hacking level to 0.75 at 10x required hacking level

		// skip target if scripts were deployed in a previous run to prevent overlaps
		var in_progress = servers.some(
			(host) =>
				ns.isRunning(SCRIPT_BASE + "weaken.js", host, target) ||
				ns.isRunning(SCRIPT_BASE + "grow.js", host, target) ||
				ns.isRunning(SCRIPT_BASE + "hack.js", host, target),
		);
		if (in_progress) continue;

		// define current and target values
		var current_money = ns.getServerMoneyAvailable(target);
		var current_security = ns.getServerSecurityLevel(target);

		var money_target = ns.getServerMaxMoney(target) * 0.95;
		var security_target = ns.getServerMinSecurityLevel(target) * 1.25;

		// calculate needed threads for required action
		var WEAKEN_THREADS = Math.ceil(
			(current_security - security_target) / ns.weakenAnalyze(1),
		);
		let grow_threads = 5;
		if (current_money != 0) {
			grow_threads = Math.ceil(
				ns.growthAnalyze(target, ns.getServerMaxMoney(target) / current_money),
			);
		}
		const HACK_THREADS = Math.ceil(hack_perc / ns.hackAnalyze(target));

		// execute action on available host servers
		if (current_security > security_target && WEAKEN_THREADS > 0) {
			execute(ns, "weaken", target, WEAKEN_THREADS);
		} else if (current_money < money_target && grow_threads > 0) {
			execute(ns, "grow", target, grow_threads);
		} else if (HACK_THREADS > 0) {
			execute(ns, "hack", target, HACK_THREADS);
		}
	}

	// use free RAM on servers
	for (var server of servers.filter((a) => a != "home")) {
		if (SHARE_SERVERS.includes(server)) {
			var script_path = SCRIPT_BASE + "share.js";
		} else {
			var script_path = SCRIPT_BASE + "xp.js";
		}

		var script_ram = ns.getScriptRam(script_path);

		if (!ns.fileExists(script_path, server)) {
			ns.scp(script_path, server);
		}

		var threads = Math.floor(
			(ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / script_ram,
		);

		if (threads > 0) {
			ns.exec(script_path, server, threads);
		}
	}
}

function execute(ns: NS, action: string, target: string, total_needed_threads: number) {
	const SCRIPT_PATH = SCRIPT_BASE + action + ".js";
	var SCRIPT_RAM = ns.getScriptRam(SCRIPT_PATH);
	let needed_threads = total_needed_threads;

	var servers = scanServers(ns)["hasRootAccess"];
	servers.push(servers.splice(servers.indexOf("home"), 1)[0]); // put home at end of servers array

	for (var host of servers) {
		ns.scriptKill(SCRIPT_BASE + "xp.js", host);
		var available_ram =
			(host != "home"
				? ns.getServerMaxRam(host)
				: ns.getServerMaxRam(host) - 64) - ns.getServerUsedRam(host);
		var host_cores = ns.getServer(host).cpuCores;

		if (needed_threads > 0) {
			if (!ns.fileExists(SCRIPT_PATH, host)) {
				ns.scp(SCRIPT_PATH, host);
			}

			var available_threads = Math.floor(available_ram / SCRIPT_RAM);
			var deployed_threads = Math.min(
				Math.floor(needed_threads / host_cores),
				available_threads,
			);

			if (deployed_threads <= 0) {
				continue;
			} else {
				ns.exec(SCRIPT_PATH, host, deployed_threads, target);
				needed_threads -= deployed_threads * host_cores;
			}
		} else return; // no more scripts need to be ran for this target
	}
}
