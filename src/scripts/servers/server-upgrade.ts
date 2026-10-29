import { NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";
import { getMoney } from "../logging/money";

const scriptBase = "/scripts/hacking/actions/";

/**
 * Prints an overview of all purchased servers.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	for (let s of ns.cloud.getServerNames()) {
		ns.tprint(s + ": " + ns.getServerMaxRam(s) + "GB RAM");
	}
}

/**
 * Purchases and upgrades servers based on current money
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function manageServers(ns: NS) {
	const timestamp = getTimestamp();

	while (
		ns.cloud.getServerCost(8) < ns.getPlayer().money &&
		ns.cloud.getServerNames().length < ns.cloud.getServerLimit()
	) {
		const currentServerCount = ns.cloud.getServerNames().length;
		const nextServerNumber =
			currentServerCount < 9
				? "0" + String(currentServerCount + 1)
				: String(currentServerCount + 1);
		ns.cloud.purchaseServer("server_" + nextServerNumber, 8);
		ns.print(
			timestamp + " Purchased server_" + String(ns.cloud.getServerNames().length),
		);
	}

	if (ns.cloud.getServerNames().length == ns.cloud.getServerLimit()) {
		let upgradeTarget = 0;

		if (
			ns.getServerMaxRam(ns.cloud.getServerNames()[0]) ==
			ns.getServerMaxRam(
				ns.cloud.getServerNames()[ns.cloud.getServerNames().length - 1],
			)
		) {
			upgradeTarget = ns.getServerMaxRam(ns.cloud.getServerNames()[0]) * 2;
		} else {
			upgradeTarget = ns.getServerMaxRam(ns.cloud.getServerNames()[0]);
		}

		for (let s of ns.cloud.getServerNames()) {
			const upgradeCost = ns.cloud.getServerUpgradeCost(s, upgradeTarget);

			const upgradeCheck =
				!ns.isRunning(scriptBase + "share.js", "server_25") &&
				upgradeCost < ns.getPlayer().money * 0.5;

			if (upgradeCheck && ns.getServerMaxRam(s) != upgradeTarget) {
				ns.cloud.upgradeServer(s, upgradeTarget);
				ns.print(
					timestamp +
						" Upgraded " +
						s +
						" to " +
						upgradeTarget +
						"GB RAM for " +
						getMoney(upgradeCost),
				);
			} else if (
				ns.getServerMaxRam(s) != upgradeTarget &&
				upgradeCost < ns.getPlayer().money * 0.002
			) {
				ns.cloud.upgradeServer(s, upgradeTarget);
				ns.print(
					timestamp +
						" Upgraded " +
						s +
						" to " +
						upgradeTarget +
						"GB RAM for " +
						getMoney(upgradeCost),
				);
			}
		}
	}
}
