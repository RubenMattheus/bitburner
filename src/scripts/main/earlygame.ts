import { NS } from "@ns";
import { commitCrime } from "../mechanics/gang";
import { setupLog } from "./setup-log";
import { manageHacknetNodes } from "../mechanics/hacknet";

/**
 * Commits crime and raises home RAM
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 3, 8);
	ns.ui.setTailTitle("Earlygame");

	await ns.sleep(5000);

	while (ns.getServerMaxRam() < 256 || ns.getPlayer().karma > -54000) {
		earlygame(ns);
		await ns.sleep(10500);
	}

	ns.run("./main.js");
	ns.ui.closeTail();
	ns.scriptKill("scripts/main/earlygame.js");
}

function earlygame(ns: NS) {
	commitCrime(ns);
	manageHacknetNodes(ns);
	ns.singularity.upgradeHomeRam();
}
