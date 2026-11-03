import { NS, FactionName, ProgramName } from "@ns";
import { scan, findServer } from "./scan";
import { getTimestamp } from "../logging/timestamp";

export async function main(ns: NS): Promise<void> {
	if (await backdoor(ns, "w0r1d_d43m0n", false)) {
		ns.alert("Connected to w0r1d_d43m0n");
	} else {
		ns.alert(
			"w0r1d_d43m0n is not yet visible or hacking level is too low (required hacking level: " +
				ns.getServerRequiredHackingLevel("w0r1d_d43m0n") +
				")",
		);
	}
}

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

export async function backdoorServers(
	ns: NS,
	finishBitnode: boolean = false,
): Promise<void> {
	const servers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets"];

	if (finishBitnode) {
		servers.push("w0r1d_d43m0n");
	}

	for (let s of servers) {
		await backdoor(ns, s);
	}
}

async function backdoor(
	ns: NS,
	server: string,
	install: boolean = true,
): Promise<boolean> {
	if (findServer(ns, server).length == 0) {
		return false;
	}

	if (
		ns.hasRootAccess(server) &&
		ns.getServerRequiredHackingLevel(server) < ns.getPlayer().skills.hacking &&
		!ns.getServer(server).backdoorInstalled
	) {
		const serverPath = findServer(ns, server);
		for (let p of serverPath) {
			ns.singularity.connect(p);
		}

		if (install) {
			await ns.singularity.installBackdoor();
			ns.singularity.connect("home");
		}
		return true;
	} else {
		return false;
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
