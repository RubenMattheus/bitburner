import { NS, FactionName, ProgramName } from "@ns";
import { scanServers, find_server } from "./server-scan";
import { get_timestamp } from "../logging/timestamp";

export function nuke(ns: NS) {
	var timestamp = get_timestamp();

	var portScripts = 0;
	var no_root_access = scanServers(ns)["noRootAccess"];

	for (var server of no_root_access) {
		// if (ns.fileExists("BruteSSH.exe")) {
		// 	ns.brutessh(server);
		// }
		// if (ns.fileExists("FTPCrack.exe")) {
		// 	ns.ftpcrack(server);
		// }
		// if (ns.fileExists("relaySMTP.exe")) {
		// 	ns.relaysmtp(server);
		// }
		// if (ns.fileExists("HTTPWorm.exe")) {
		// 	ns.httpworm(server);
		// }
		// if (ns.fileExists("SQLInject.exe")) {
		// 	ns.sqlinject(server);
		// }

		ns.brutessh(server);
		ns.ftpcrack(server);
		ns.relaysmtp(server);
		ns.httpworm(server);
		ns.sqlinject(server);

		if (ns.nuke(server)) {
			ns.print(timestamp + " Gained access to " + server);
		}
	}
}

export async function backdoor(ns: NS, finish_bitnode: boolean = true): Promise<void> {
	var current_factions = ns.getPlayer().factions;
	var current_invites = ns.singularity.checkFactionInvitations();

	var server_map: [string, string[]][] = [
		["CyberSec", find_server(ns, "CSEC")],
		["NiteSec", find_server(ns, "avmnite-02h")],
		["The Black Hand", find_server(ns, "I.I.I.I")],
		["BitRunners", find_server(ns, "run4theh111z")],
		["Fulcrum Secret Technologies", find_server(ns, "fulcrumassets")],
		["w0r1d_d43m0n", find_server(ns, "w0r1d_d43m0n")],
	];

	var paths = [];

	function backdoor_needed(faction_map: [string, string[]]) {
		var faction = faction_map[0];
		var path = faction_map[1];

		var joined = current_factions.includes(faction as FactionName);
		var invited = current_invites.includes(faction as FactionName);

		var can_join =
			faction != "Fulcrum Secret Technologies" ||
			ns.singularity.getCompanyRep("Fulcrum Technologies") < 400000;
		var can_backdoor =
			ns.hasRootAccess(path[path.length - 1]) &&
			ns.getServerRequiredHackingLevel(path[path.length - 1]) <=
				ns.getHackingLevel();

		return !joined && !invited && can_join && can_backdoor;
	}

	for (var f of server_map) {
		if (backdoor_needed(f)) {
			paths.push(f[1]);
		} else if (f[0] == "w0r1d_d43m0n" && f[1] != undefined && finish_bitnode) {
			// target is undefined when w0r1d_d43m0n isn't visible yet
			paths.push(f[1]);
		}
	}

	for (var p of paths) {
		if (p.length == 0) {
			continue;
		}
		for (const server of p) {
			if (server == "home") {
				continue;
			} else {
				ns.singularity.connect(server);
				await ns.singularity.installBackdoor();
			}
		}
		ns.singularity.connect("home");
	}
}

export function setup_tor(ns: NS) {
	if (ns.singularity.purchaseTor()) {
		for (var exe of [
			"BruteSSH.exe",
			"FTPCrack.exe",
			"relaySMTP.exe",
			"HTTPWorm.exe",
			"SQLInject.exe",
		]) {
			if (!ns.singularity.purchaseProgram(exe as ProgramName)) {
				return;
			}
		}
	}
}
