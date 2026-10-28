import { NS } from "@ns";
// LOGGING
import { setup_log } from "./setup-log";
// MECHANICS
import { manage_gang } from "../mechanics/gang";

/**
 * Manages everything gang-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	setup_log(ns);

	while (true) {
		manage_gang(ns, "Combat");
		await ns.sleep(10200);
	}
}
