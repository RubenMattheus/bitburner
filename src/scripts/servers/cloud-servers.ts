import { NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";
import { formatMoney } from "../logging/money";

const purchaseRam = 32;

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
	ns.tprint("Max cloud server RAM: " + ns.cloud.getRamLimit() + "GB");
}

/**
 * Purchases and upgrades servers based on current money
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function manageServers(ns: NS) {
	const timestamp = getTimestamp();

	if (
		ns.cloud.getServerNames().length < ns.cloud.getServerLimit() &&
		ns.cloud.getServerCost(purchaseRam) < ns.getPlayer().money
	) {
		purchaseServer(ns, timestamp);
	} else {
		upgradeServers(ns, timestamp);
	}
}

function purchaseServer(ns: NS, timestamp: string) {
	const currentServerCount = ns.cloud.getServerNames().length;
	const nextServerNumber =
		currentServerCount < 9
			? "0" + String(currentServerCount + 1)
			: String(currentServerCount + 1);
	ns.print(
		timestamp +
			" Purchased " +
			ns.cloud.purchaseServer("server-" + nextServerNumber, purchaseRam),
	);
}

function upgradeServers(ns: NS, timestamp: string) {
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
				ns.print(
					timestamp +
						" Upgraded " +
						s +
						" to " +
						upgradeTarget +
						"GB RAM for " +
						formatMoney(upgradeCost),
				);
			} else {
				return;
			}
		} else {
			return;
		}
	}
}
