import { NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";

/**
 * Sets up the log for the main script.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} minimal - Whether to use minimal logging (default: true).
 */
export function setupLog(ns: NS, minimal: boolean = true, x: number, y: number) {
	if (minimal) {
		ns.disableLog("ALL");
	}

	ns.print(getTimestamp() + " Launched script");

	const windowSize = ns.ui.windowSize();
	const tailSize = [windowSize[0] / 4, windowSize[1] / 10];
	const tailCoords = [tailSize[0] * x, tailSize[1] * y];

	ns.ui.openTail();
	ns.ui.resizeTail(tailSize[0], tailSize[1]);
	ns.ui.moveTail(tailCoords[0], tailCoords[1]);
}
