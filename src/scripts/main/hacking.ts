import { NS } from "@ns";
// LOGGING
import { setup_log } from "./setup-log";
// SERVERS
import { setup_tor, nuke, backdoor } from "../servers/server-access";
import { manage_servers } from "../servers/server-upgrade";
// HACKING
import { deploy } from "../hacking/orchestrator";
// MECHANICS
import { join_factions, buy_augmentations } from "../mechanics/factions";

/**
 * Perform all hacking-related tasks, including server management, faction work, and augmentation purchasing.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	async function hacking() {
		setup_tor(ns);
		nuke(ns);
		await backdoor(ns);
		deploy(ns);

		join_factions(ns);
		buy_augmentations(ns);

		manage_servers(ns);
	}

	setup_log(ns);

	while (true) {
		await hacking();
		await ns.sleep(10200);
	}
}
