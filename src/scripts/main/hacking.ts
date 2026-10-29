import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { setupTor, nuke, backdoor } from "../servers/server-access";
import { manageServers } from "../servers/server-upgrade";
import { deploy } from "../hacking/orchestrator";
import { joinFactions, buyAugmentations } from "../mechanics/factions";

/**
 * Perform all hacking-related tasks, including server management, faction work, and augmentation purchasing.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	async function hacking() {
		setupTor(ns);
		nuke(ns);
		await backdoor(ns);
		deploy(ns);

		joinFactions(ns);
		buyAugmentations(ns);

		manageServers(ns);
	}

	setupLog(ns, true, 3, 8);

	while (true) {
		await hacking();
		await ns.sleep(10200);
	}
}
