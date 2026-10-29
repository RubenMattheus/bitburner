import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { getTimestamp } from "../logging/timestamp";
import { manageBladeburner } from "../mechanics/bladeburner";

/**
 * Manages everything Bladeburner-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 3, 5);

	let nextBlackOp = ns.bladeburner.getNextBlackOp();
	ns.print(getTimestamp() + " Next Black Operation is " + nextBlackOp?.name);

	while (true) {
		if (ns.bladeburner.getNextBlackOp()?.name != nextBlackOp?.name) {
			ns.print(
				getTimestamp() + " Completed Black Operation " + nextBlackOp?.name,
			);
			nextBlackOp = ns.bladeburner.getNextBlackOp();
		}
		manageBladeburner(ns);
		await ns.sleep(10200);
	}
}
