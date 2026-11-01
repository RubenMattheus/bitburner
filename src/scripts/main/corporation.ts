import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { manageCorporation } from "../mechanics/corporation";

/**
 * Manages everything corporation-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 3, 5);
	ns.ui.setTailTitle("Corporation");

	await ns.sleep(5000);

	while (true) {
		manageCorporation(ns);
		await ns.sleep(10500);
	}
}
