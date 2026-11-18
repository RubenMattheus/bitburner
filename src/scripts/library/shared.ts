import { NS } from "@ns";

/**
 * Prints an overview of all relevant servers to backdoor for progress
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	let alertString = `SERVER SCAN`;
	alertString = alertString.concat(`
		CyberSec: ${findServer(ns, "CSEC")}
		NiteSec: ${findServer(ns, "avmnite-02h")}
		The Black Hand: ${findServer(ns, "I.I.I.I")}
		BitRunners: ${findServer(ns, "run4theh111z")}
		Fulcrum Secret Technologies: ${findServer(ns, "fulcrumassets")}
		
		w0r1d_d43m0n : ${findServer(ns, "w0r1d_d43m0n")}
	`);
	ns.alert(alertString);
}

/**
 * Returns a dictionary containing all servers with keys "hasRootAccess" and "noRootAccess"
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {{ hasRootAccess: string[], noRootAccess: string[] }} The dictionary containing all servers
 */
export function getServers(ns: NS) {
	let scanned = ["home"];
	const checking = ns.scan();

	while (checking.length > 0) {
		const currentServer = checking[0];
		const currentScan = ns.scan(currentServer);

		for (let server of currentScan) {
			if (!checking.includes(server) && !scanned.includes(server)) {
				checking.push(server);
			}
		}

		scanned.push(currentServer);
		checking.shift();
	}

	scanned = scanned.filter((s) => !s.includes("hacknet"));
	return scanned;
}

export function getRootAccessServers(ns: NS) {
	const servers = getServers(ns);
	return servers
		.filter((s) => ns.hasRootAccess(s))
		.sort(
			(a, b) =>
				ns.getServerRequiredHackingLevel(b) -
				ns.getServerRequiredHackingLevel(a),
		);
}

export function getNoRootAccessServers(ns: NS) {
	const servers = getServers(ns);
	return servers
		.filter((s) => !ns.hasRootAccess(s))
		.sort(
			(a, b) =>
				ns.getServerRequiredHackingLevel(b) -
				ns.getServerRequiredHackingLevel(a),
		);
}

/**
 * Returns the server 'path' to a given server
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} target -The target server to find the path to.
 */
export function findServer(ns: NS, target: string): string[] {
	if (target == "home" || !ns.serverExists(target)) {
		return [];
	}

	let server = target;
	let parent = ns.scan(server)[0];
	const path = [server];

	while (parent != "home") {
		path.unshift(parent);
		server = parent;
		parent = ns.scan(server)[0];
	}

	path.unshift("home");

	return path;
}

export function nuke(ns: NS) {
	const servers = getNoRootAccessServers(ns);

	for (let s of servers) {
		ns.brutessh(s);
		ns.ftpcrack(s);
		ns.relaysmtp(s);
		ns.httpworm(s);
		ns.sqlinject(s);

		ns.nuke(s);
	}
}
