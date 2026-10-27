import { NS } from "@ns";
import { get_timestamp } from "../logging/timestamp";
import { get_money } from "../logging/money";

const SCRIPT_BASE = "/scripts/hacking/actions/";

export async function main(ns: NS): Promise<void> {
	for (var s of ns.getPurchasedServers()) {
		ns.tprint(s + ": " + ns.getServerMaxRam(s) + "GB RAM");
	}
}

export function manage_servers(ns: NS) {
	const TIMESTAMP = get_timestamp();

	while (
		ns.getPurchasedServerCost(8) < ns.getPlayer().money &&
		ns.getPurchasedServers().length < ns.getPurchasedServerLimit()
	) {
		const CURRENT_SERVER_COUNT = ns.getPurchasedServers().length;
		const NEXT_SERVER_NUMBER =
			CURRENT_SERVER_COUNT < 9
				? "0" + String(CURRENT_SERVER_COUNT + 1)
				: String(CURRENT_SERVER_COUNT + 1);
		ns.purchaseServer("server_" + NEXT_SERVER_NUMBER, 8);
		ns.print(
			TIMESTAMP + " Purchased server_" + String(ns.getPurchasedServers().length),
		);
	}

	if (ns.getPurchasedServers().length == ns.getPurchasedServerLimit()) {
		var upgrade_target = 0;

		if (
			ns.getServerMaxRam(ns.getPurchasedServers()[0]) ==
			ns.getServerMaxRam(
				ns.getPurchasedServers()[ns.getPurchasedServers().length - 1],
			)
		) {
			upgrade_target = ns.getServerMaxRam(ns.getPurchasedServers()[0]) * 2;
		} else {
			upgrade_target = ns.getServerMaxRam(ns.getPurchasedServers()[0]);
		}

		for (var s of ns.getPurchasedServers()) {
			const UPGRADE_COST = ns.getPurchasedServerUpgradeCost(s, upgrade_target);

			const UPGRADE_CHECK =
				!ns.isRunning(SCRIPT_BASE + "share.js", "server_25") &&
				UPGRADE_COST < ns.getPlayer().money * 0.5;

			if (UPGRADE_CHECK && ns.getServerMaxRam(s) != upgrade_target) {
				ns.upgradePurchasedServer(s, upgrade_target);
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
				ns.upgradePurchasedServer(s, upgrade_target);
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
