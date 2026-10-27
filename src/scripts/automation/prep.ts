import { NS } from "@ns";
import { setup, prep } from "./automation";

const SCRIPT_BASE = "scripts/automation/";

export async function main(ns: NS): Promise<void> {
	var goal = ns.args[0];
	setup(ns);

	while (ns.getServerMaxRam("home") < 256) {
		prep(ns);
		ns.bladeburner.joinBladeburnerDivision(); // breaks RAM cost when added to prep function
		await ns.sleep(10200);
	}

	ns.ui.closeTail();

	ns.exec(SCRIPT_BASE + goal + ".js", "home");
	ns.scriptKill(SCRIPT_BASE + "prep.js", "home");
}
