import { NS } from "@ns";
import { managerClass } from "../library/manager";

export class serverManager extends managerClass {
	purchaseRam: number;

	constructor(ns: NS, purchaseRam: number) {
		super(ns, "Cloud servers");
		this.purchaseRam = purchaseRam;
	}

	tick(ns: NS) {
		if (
			ns.cloud.getServerNames().length < ns.cloud.getServerLimit() &&
			ns.cloud.getServerCost(this.purchaseRam) < ns.getPlayer().money
		) {
			this.purchaseServer(ns);
		} else {
			this.upgradeServers(ns);
		}
	}

	purchaseServer(ns: NS) {
		this.log(
			ns,
			`Purchased ${ns.cloud.purchaseServer(`server-${String(ns.cloud.getServerNames().length + 1).padStart(2, "0")}`, this.purchaseRam)}.`,
		);
	}

	upgradeServers(ns: NS) {
		const servers = ns.cloud.getServerNames();
		const upgradeTarget = Math.min(
			ns.getServerMaxRam(servers[servers.length - 1]) * 2,
			ns.cloud.getRamLimit(),
		);
		const serversToUpgrade = servers.filter(
			(s) => ns.getServerMaxRam(s) < upgradeTarget,
		);

		if (serversToUpgrade.length == 0) {
			return;
		}

		const upgradeCost = ns.cloud.getServerUpgradeCost(
			serversToUpgrade[0],
			upgradeTarget,
		);

		for (let s of serversToUpgrade) {
			if (ns.getPlayer().money * 0.01 > upgradeCost) {
				if (ns.cloud.upgradeServer(s, upgradeTarget)) {
					this.log(
						ns,
						`Upgraded ${s} to ${ns.format.ram(upgradeTarget)} RAM for $${ns.format.number(upgradeCost)}.`,
					);
				} else {
					return;
				}
			} else {
				return;
			}
		}
	}
}

/**
 * Prints an overview of all purchased servers.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	let alertString = `CLOUD SERVER OVERVIEW`;
	for (let s of ns.cloud.getServerNames()) {
		alertString = alertString.concat(
			`\n${s}: ${ns.format.ram(ns.getServerMaxRam(s))} RAM`,
		);
	}
	alertString = alertString.concat(
		`\nMax cloud server RAM: ${ns.format.ram(ns.cloud.getRamLimit())}`,
	);

	ns.alert(alertString);
}
