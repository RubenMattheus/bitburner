import { NS } from "@ns";
// LOGGING
import { setup_log } from "./setup-log";
// MECHANICS
import { commit_crime } from "../mechanics/gang";

const SCRIPT_BASE = "scripts/automation/";

export async function main(ns: NS): Promise<void> {
	var goal = ns.args[0];
	setup_log(ns);

	while (ns.getServerMaxRam("home") < 256) {
		prep(ns);
		ns.bladeburner.joinBladeburnerDivision(); // breaks RAM cost when added to prep function
		await ns.sleep(10200);
	}

	ns.ui.closeTail();

	ns.exec(SCRIPT_BASE + goal + ".js", "home");
	ns.scriptKill(SCRIPT_BASE + "prep.js", "home");
}

// RESTRICTION: MAX RAM COST = 32GB
// GOAL: COMMIT CRIME UNTIL HOME RAM UPGRADED
export function prep(ns: NS) {
	commit_crime(ns);
	ns.singularity.upgradeHomeRam();
}
