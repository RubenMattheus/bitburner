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
	ns.tprint("CyberSec:\t\t" + find_server(ns, "CSEC"));
	ns.tprint("NiteSec:\t\t" + find_server(ns, "avmnite-02h"));
	ns.tprint("The Black Hand:\t" + find_server(ns, "I.I.I.I"));
	ns.tprint("BitRunners:\t\t" + find_server(ns, "run4theh111z"));
	ns.tprint("Fulcrum Secret Technologies: " + find_server(ns, "fulcrumassets"));
	ns.tprint("-- ENDGAME --");
	ns.tprint("w0r1d_d43m0n :\t\t" + find_server(ns, "w0r1d_d43m0n"));
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
	var scanned = ["home"];
	var checking = ns.scan();

	while (checking.length > 0) {
		var CURRENT_SERVER = checking[0];
		var CURRENT_SCAN = ns.scan(CURRENT_SERVER);

		for (var server of CURRENT_SCAN) {
			if (!checking.includes(server) && !scanned.includes(server)) {
				checking.push(server);
			}
		}

		scanned.push(CURRENT_SERVER);
		checking.shift();
	}

	var server_dict: { hasRootAccess: string[]; noRootAccess: string[] } = {
		hasRootAccess: [],
		noRootAccess: [],
	};

	for (var server of scanned) {
		if (ns.hasRootAccess(server)) {
			server_dict["hasRootAccess"].push(server);
		} else {
			server_dict["noRootAccess"].push(server);
		}
	}

	server_dict["hasRootAccess"].sort(function (a, b) {
		return (
			ns.getServerRequiredHackingLevel(a) - ns.getServerRequiredHackingLevel(b)
		);
	});
	server_dict["noRootAccess"].sort(function (a, b) {
		return (
			ns.getServerRequiredHackingLevel(a) - ns.getServerRequiredHackingLevel(b)
		);
	});

	return server_dict;
}

/**
 * Returns the server 'path' to a given server
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} target -The target server to find the path to.
 */
export function find_server(ns: NS, target: string): string[] {
	var servers = scanServers(ns);

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
	var path = [server];

	while (parent != "home") {
		path.unshift(parent);
		server = parent;
		parent = ns.scan(server)[0];
	}

	path.unshift("home");

	return path;
}
