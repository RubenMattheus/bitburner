import { NS } from "@ns";
import { get_timestamp } from "../logging/timestamp";

/**
 * Sets up the log for the main script.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} minimal - Whether to use minimal logging (default: true).
 */
export function setup_log(ns: NS, minimal: boolean = true) {
	if (minimal) {
		ns.disableLog("ALL");
	}

	ns.print(get_timestamp() + " Launched main script");

	const window_size = ns.ui.windowSize();
	const tail_size = [window_size[0] / 3, window_size[1] / 3]; // width, height
	const tail_coords = [window_size[0] / 1.8625, window_size[1] / 175]; // x, y

	ns.ui.openTail();
	ns.ui.resizeTail(tail_size[0], tail_size[1]);
	ns.ui.moveTail(tail_coords[0], tail_coords[1]);
}
