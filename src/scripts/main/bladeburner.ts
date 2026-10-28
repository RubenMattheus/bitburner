import { NS } from "@ns";
// LOGGING
import { setup_log } from "./setup-log";
// MECHANICS
import { manage_bladeburner } from "../mechanics/bladeburner";

/**
 * Manages everything Bladeburner-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	setup_log(ns);

	while (true) {
		manage_bladeburner(ns);
		await ns.sleep(10200);
	}
}
