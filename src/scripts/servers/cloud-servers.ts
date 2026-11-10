import { NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";

const purchaseRam = 32;

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

/**
 * Purchases and upgrades servers based on current money
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function manageServers(ns: NS) {
	if (
		ns.cloud.getServerNames().length < ns.cloud.getServerLimit() &&
		ns.cloud.getServerCost(purchaseRam) < ns.getPlayer().money
	) {
		purchaseServer(ns);
	} else {
		upgradeServers(ns);
	}
}

function purchaseServer(ns: NS) {
	ns.print(
		`${getTimestamp()} Purchased ${ns.cloud.purchaseServer(`server-${String(ns.cloud.getServerNames().length + 1).padStart(2, "0")}`, purchaseRam)}`,
	);
}

function upgradeServers(ns: NS) {
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
					`${getTimestamp()} Upgraded ${s} to ${ns.format.ram(upgradeTarget)} RAM for $${ns.format.number(upgradeCost)}`,
				);
			} else {
				return;
			}
		} else {
			return;
		}
	}
}
