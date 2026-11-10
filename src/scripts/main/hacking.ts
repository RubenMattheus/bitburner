import { NS } from "@ns";
import { setupLog } from "../logging/setup-log";
import { backdoorServers } from "../servers/backdoor";
import { manageServers } from "../servers/cloud-servers";
import { manageHacking } from "../hacking/orchestrator";

/**
 * Perform all hacking-related tasks, including server management, faction work, and augmentation purchasing.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	let x = Number(ns.args[0]),
		y = Number(ns.args[1]);
	setupLog(ns, true, x, y);
	ns.ui.setTailTitle("Hacking");

	await ns.sleep(5000);

	while (true) {
		await backdoorServers(ns, false);
		manageServers(ns);
		manageHacking(ns);

		await ns.sleep(10500);
	}
}
