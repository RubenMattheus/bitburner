import { NS } from "@ns";

/**
 * Prints an overview of all relevant servers to backdoor for progress
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	ns.tprint("-- FACTIONS --");
	ns.tprint("CyberSec:\t\t" + findServer(ns, "CSEC"));
	ns.tprint("NiteSec:\t\t" + findServer(ns, "avmnite-02h"));
	ns.tprint("The Black Hand:\t" + findServer(ns, "I.I.I.I"));
	ns.tprint("BitRunners:\t\t" + findServer(ns, "run4theh111z"));
	ns.tprint("Fulcrum Secret Technologies: " + findServer(ns, "fulcrumassets"));
	ns.tprint("-- ENDGAME --");
	ns.tprint("w0r1d_d43m0n :\t\t" + findServer(ns, "w0r1d_d43m0n"));
}

/**
 * Returns a dictionary containing all servers with keys "hasRootAccess" and "noRootAccess"
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {{ hasRootAccess: string[], noRootAccess: string[] }} The dictionary containing all servers
 */
export function scanServers(ns: NS): {
	hasRootAccess: string[];
	noRootAccess: string[];
} {
	const scanned = ["home"];
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

	const serverDict: { hasRootAccess: string[]; noRootAccess: string[] } = {
		hasRootAccess: [],
		noRootAccess: [],
	};

	for (let server of scanned) {
		if (ns.hasRootAccess(server)) {
			serverDict["hasRootAccess"].push(server);
		} else {
			serverDict["noRootAccess"].push(server);
		}
	}

	serverDict["hasRootAccess"].sort(function (a, b) {
		return (
			ns.getServerRequiredHackingLevel(a) - ns.getServerRequiredHackingLevel(b)
		);
	});
	serverDict["noRootAccess"].sort(function (a, b) {
		return (
			ns.getServerRequiredHackingLevel(a) - ns.getServerRequiredHackingLevel(b)
		);
	});

	return serverDict;
}

/**
 * Returns the server 'path' to a given server
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} target -The target server to find the path to.
 */
export function findServer(ns: NS, target: string): string[] {
	const servers = scanServers(ns);

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
