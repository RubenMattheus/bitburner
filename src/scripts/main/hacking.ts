import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { setupTor, nuke, backdoorServers } from "../servers/backdoor";
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
	setupLog(ns, true, 3, 7);
	ns.ui.setTailTitle("Hacking");

	await ns.sleep(5000);

	while (true) {
		await hacking(ns);
		await ns.sleep(10500);
	}
}

async function hacking(ns: NS) {
	setupTor(ns);
	nuke(ns);
	await backdoorServers(ns, false);

	manageHacking(ns);
	manageServers(ns);
}
