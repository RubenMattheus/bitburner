import { NS, FactionName, ProgramName } from "@ns";
import { scan, findServer } from "./scan";
import { getTimestamp } from "../logging/timestamp";

export function nuke(ns: NS) {
	const timestamp = getTimestamp();

	const noRootAccess = scan(ns)["noRootAccess"];

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

export async function backdoor(ns: NS, finishBitnode: boolean = false): Promise<void> {
	const servers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets"];

	if (finishBitnode) {
		servers.push("w0r1d_d43m0n");
	}

	for (let s of servers) {
		if (findServer(ns, s).length == 0) {
			continue;
		}
		if (
			ns.hasRootAccess(s) &&
			ns.getServerRequiredHackingLevel(s) < ns.getPlayer().skills.hacking &&
			!ns.getServer(s).backdoorInstalled
		) {
			const serverPath = findServer(ns, s);
			for (let p of serverPath) {
				ns.singularity.connect(p);
			}
			await ns.singularity.installBackdoor();
			ns.singularity.connect("home");
		}
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
