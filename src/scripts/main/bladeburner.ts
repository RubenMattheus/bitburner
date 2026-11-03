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
	let x = Number(ns.args[0]),
		y = Number(ns.args[1]);
	setupLog(ns, true, x, y);
	ns.ui.setTailTitle("Bladeburner");

	let nextBlackOp;
	if (ns.bladeburner.inBladeburner()) {
		nextBlackOp = ns.bladeburner.getNextBlackOp();
		ns.print(getTimestamp() + " Next Black Operation is " + nextBlackOp?.name);
	}

	await ns.sleep(5000);

	while (true) {
		if (nextBlackOp && ns.bladeburner.getNextBlackOp()?.name != nextBlackOp?.name) {
			ns.print(
				getTimestamp() + " Completed Black Operation " + nextBlackOp?.name,
			);
			nextBlackOp = ns.bladeburner.getNextBlackOp();
		}
		manageBladeburner(ns);
		await ns.sleep(10500);
	}
}
