import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { manageSleeves } from "../mechanics/sleeve";

/**
 * Manages everything sleeve-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 2, 7);
	ns.ui.setTailTitle("Sleeves");

	await ns.sleep(5000);

	while (true) {
		manageSleeves(ns);
		await ns.sleep(10500);
	}
}
