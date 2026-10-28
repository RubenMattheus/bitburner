import { NS } from "@ns";
import { get_timestamp } from "../logging/timestamp";
import { get_money } from "../logging/money";

const SCRIPT_BASE = "/scripts/hacking/actions/";

/**
 * Prints an overview of all purchased servers.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	for (var s of ns.cloud.getServerNames()) {
		ns.tprint(s + ": " + ns.getServerMaxRam(s) + "GB RAM");
	}
}

/**
 * Purchases and upgrades servers based on current money
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function manage_servers(ns: NS) {
	const TIMESTAMP = get_timestamp();

	while (
		ns.cloud.getServerCost(8) < ns.getPlayer().money &&
		ns.cloud.getServerNames().length < ns.cloud.getServerLimit()
	) {
		const CURRENT_SERVER_COUNT = ns.cloud.getServerNames().length;
		const NEXT_SERVER_NUMBER =
			CURRENT_SERVER_COUNT < 9
				? "0" + String(CURRENT_SERVER_COUNT + 1)
				: String(CURRENT_SERVER_COUNT + 1);
		ns.cloud.purchaseServer("server_" + NEXT_SERVER_NUMBER, 8);
		ns.print(
			TIMESTAMP + " Purchased server_" + String(ns.cloud.getServerNames().length),
		);
	}

	if (ns.cloud.getServerNames().length == ns.cloud.getServerLimit()) {
		var upgrade_target = 0;

		if (
			ns.getServerMaxRam(ns.cloud.getServerNames()[0]) ==
			ns.getServerMaxRam(
				ns.cloud.getServerNames()[ns.cloud.getServerNames().length - 1],
			)
		) {
			upgrade_target = ns.getServerMaxRam(ns.cloud.getServerNames()[0]) * 2;
		} else {
			upgrade_target = ns.getServerMaxRam(ns.cloud.getServerNames()[0]);
		}

		for (var s of ns.cloud.getServerNames()) {
			const UPGRADE_COST = ns.cloud.getServerUpgradeCost(s, upgrade_target);

			const UPGRADE_CHECK =
				!ns.isRunning(SCRIPT_BASE + "share.js", "server_25") &&
				UPGRADE_COST < ns.getPlayer().money * 0.5;

			if (UPGRADE_CHECK && ns.getServerMaxRam(s) != upgrade_target) {
				ns.cloud.upgradeServer(s, upgrade_target);
				ns.print(
					TIMESTAMP +
						" Upgraded " +
						s +
						" to " +
						upgrade_target +
						"GB RAM for " +
						get_money(UPGRADE_COST),
				);
			} else if (
				ns.getServerMaxRam(s) != upgrade_target &&
				UPGRADE_COST < ns.getPlayer().money * 0.002
			) {
				ns.cloud.upgradeServer(s, upgrade_target);
				ns.print(
					TIMESTAMP +
						" Upgraded " +
						s +
						" to " +
						upgrade_target +
						"GB RAM for " +
						get_money(UPGRADE_COST),
				);
			}
		}
	}
}
