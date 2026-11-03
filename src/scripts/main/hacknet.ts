import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { manageHacknetNodes, manageHacknetServers } from "../mechanics/hacknet";

/**
 * Manages everything Hacknet-related
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	let x = Number(ns.args[0]),
		y = Number(ns.args[1]);
	setupLog(ns, true, x, y);
	ns.ui.setTailTitle("Hacknet");

	await ns.sleep(5000);

	while (true) {
		const rush = ns.getServerMaxRam("home") < 256;
		manageHacknetNodes(ns, rush);
		manageHacknetServers(ns);
		await ns.sleep(10500);
	}
}
