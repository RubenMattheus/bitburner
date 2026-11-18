import { NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";
import { getRootAccessServers } from "../library/shared";

export class hackingBatcher {
	target: string;
	msToGrow: number = -1;
	msToHack: number = -1;
	msToWeaken: number = -1;

	constructor(ns: NS) {
		this.target = this.getTarget(ns);
	}

	tick(ns: NS) {
		this.target = this.getTarget(ns);
	}

	log(ns: NS, message: string) {
		ns.print(`${getTimestamp()} (Batcher) ${message}`);
	}

	getTarget(ns: NS) {
		const servers = getRootAccessServers(ns).filter(
			(s) =>
				ns.getServerRequiredHackingLevel(s) <
				ns.getPlayer().skills.hacking,
		);
		return servers[0];
	}

	getGrowTime(ns: NS) {
		const server = ns.getServer(this.target);
		const player = ns.getPlayer();
		return ns.formulas.hacking.growTime(server, player);
	}

	getHackTime(ns: NS) {
		const server = ns.getServer(this.target);
		const player = ns.getPlayer();
		return ns.formulas.hacking.hackTime(server, player);
	}

	getWeakenTime(ns: NS) {
		const server = ns.getServer(this.target);
		const player = ns.getPlayer();
		return ns.formulas.hacking.weakenTime(server, player);
	}

	prep(ns: NS) {}
}
