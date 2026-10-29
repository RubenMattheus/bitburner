import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { manageHacknetNodes } from "../mechanics/hacknet";

/**
 * Manages everything hacknet-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 3, 7);

	while (true) {
		manageHacknetNodes(ns);
		await ns.sleep(10200);
	}
}
