import { NS } from "@ns";
import { setupLog } from "./setup-log";
import { getTimestamp } from "../logging/timestamp";

export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 3, 8);
	ns.ui.setTailTitle("Main");

	await ns.sleep(5000);

	while (true) {
		startScripts(ns);

		await ns.sleep(10500);
	}
}

function startScripts(ns: NS): boolean {
	if (!runScript(ns, "./hacknet.js", 3, 7)) {
		return false;
	} else if (!runScript(ns, "./singularity.js", 3, 6)) {
		return false;
		// } else if (!startScript(ns, "./bladeburner.js", 3, 5)) {
		// 	return false;
	} else if (!runScript(ns, "./sleeve.js", 2, 8)) {
		return false;
	} else if (!runScript(ns, "./gang.js", 2, 7)) {
		return false;
	} else if (!runScript(ns, "./hacking.js", 2, 6)) {
		return false;
	} else if (!runScript(ns, "./factions.js", 2, 5)) {
		return false;
	} else if (!runScript(ns, "./corporation.js", 1, 8)) {
		return false;
	} else if (!runScript(ns, "./grafting.js", 1, 7)) {
		return false;
	} else {
		return true;
	}
}

export function runScript(ns: NS, script: string, x: number, y: number): boolean {
	if (!ns.isRunning(script, "home", x, y)) {
		if (ns.run(script, 1, x, y) != 0) {
			ns.print(
				getTimestamp() + " Launched script '" + script.split("./")[1] + "'",
			);
			return true;
		} else {
			return false;
		}
	} else {
		return true;
	}
}
