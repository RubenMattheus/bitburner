import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { startScript } from "./main";
import { manageSingularity } from "../mechanics/singularity";

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
		startScript(ns, "./hacknet.js", 3, 7);
		startScript(ns, "./singularity.js", 3, 6);

		ns.singularity.upgradeHomeRam();
		ns.bladeburner.joinBladeburnerDivision();

		await ns.sleep(10500);
	}

	ns.run("./main.js");
	ns.ui.closeTail();
	ns.scriptKill("scripts/main/earlygame.js");
}
