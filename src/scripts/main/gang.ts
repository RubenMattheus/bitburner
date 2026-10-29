import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { manageGang } from "../mechanics/gang";

/**
 * Manages everything gang-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 3, 6);

	while (true) {
		manageGang(ns, "Combat");
		await ns.sleep(10200);
	}
}
