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
export function scan(ns: NS): {
	hasRootAccess: string[];
	noRootAccess: string[];
} {
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

	const serverDict = {
		hasRootAccess: scanned
			.filter((s) => ns.hasRootAccess(s))
			.sort(
				(a, b) =>
					ns.getServerRequiredHackingLevel(a) -
					ns.getServerRequiredHackingLevel(b),
			),
		noRootAccess: scanned
			.filter((s) => !ns.hasRootAccess(s))
			.sort(
				(a, b) =>
					ns.getServerRequiredHackingLevel(a) -
					ns.getServerRequiredHackingLevel(b),
			),
	};

	serverDict["hasRootAccess"] = serverDict["hasRootAccess"].filter(
		(s) => !s.includes("hacknet-server"),
	);
	serverDict["noRootAccess"] = serverDict["noRootAccess"].filter(
		(s) => !s.includes("hacknet-server"),
	);

	return serverDict;
}

/**
 * Returns the server 'path' to a given server
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} target -The target server to find the path to.
 */
export function findServer(ns: NS, target: string): string[] {
	const servers = scan(ns);

	if (target == "home") {
		return [];
	} else if (
		!servers["hasRootAccess"].includes(target) &&
		!servers["noRootAccess"].includes(target)
	) {
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
