import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { manageGrafting } from "../mechanics/grafting";

/**
 * Manages everything gang-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	let x = Number(ns.args[0]),
		y = Number(ns.args[1]);
	setupLog(ns, true, x, y);
	ns.ui.setTailTitle("Grafting");

	await ns.sleep(5000);

	while (true) {
		manageGrafting(ns);
		await ns.sleep(10500);
	}
}
