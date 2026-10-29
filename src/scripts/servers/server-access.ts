import { NS, FactionName, ProgramName } from "@ns";
import { scanServers, findServer } from "./server-scan";
import { getTimestamp } from "../logging/timestamp";

export function nuke(ns: NS) {
	const timestamp = getTimestamp();

	const noRootAccess = scanServers(ns)["noRootAccess"];

	for (let server of noRootAccess) {
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

export async function backdoor(ns: NS, finishBitnode: boolean = true): Promise<void> {
	const currentFactions = ns.getPlayer().factions;
	const currentInvites = ns.singularity.checkFactionInvitations();

	const serverMap: [string, string[]][] = [
		["CyberSec", findServer(ns, "CSEC")],
		["NiteSec", findServer(ns, "avmnite-02h")],
		["The Black Hand", findServer(ns, "I.I.I.I")],
		["BitRunners", findServer(ns, "run4theh111z")],
		["Fulcrum Secret Technologies", findServer(ns, "fulcrumassets")],
		["w0r1d_d43m0n", findServer(ns, "w0r1d_d43m0n")],
	];

	const paths = [];

	function backdoorNeeded(factionMap: [string, string[]]) {
		const faction = factionMap[0];
		const path = factionMap[1];

		const joined = currentFactions.includes(faction as FactionName);
		const invited = currentInvites.includes(faction as FactionName);

		const canJoin =
			faction != "Fulcrum Secret Technologies" ||
			ns.singularity.getCompanyRep("Fulcrum Technologies") < 400000;
		const canBackdoor =
			ns.hasRootAccess(path[path.length - 1]) &&
			ns.getServerRequiredHackingLevel(path[path.length - 1]) <=
				ns.getHackingLevel();

		return !joined && !invited && canJoin && canBackdoor;
	}

	for (let f of serverMap) {
		if (backdoorNeeded(f)) {
			paths.push(f[1]);
		} else if (f[0] == "w0r1d_d43m0n" && f[1] != undefined && finishBitnode) {
			// target is undefined when w0r1d_d43m0n isn't visible yet
			paths.push(f[1]);
		}
	}

	for (let p of paths) {
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

export function setupTor(ns: NS) {
	if (ns.singularity.purchaseTor()) {
		for (let exe of [
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
