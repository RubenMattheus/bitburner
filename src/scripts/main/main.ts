import { NS } from "@ns";
import { factionWork } from "../mechanics/factions";
import { setupLog } from "./setup-log";

export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 3, 8);
	ns.ui.setTailTitle("Main");

	await ns.sleep(5000);

	while (true) {
		startScript(ns, "./gang.js");
		startScript(ns, "./hacking.js");
		startScript(ns, "./sleeve.js");
		startScript(ns, "./factions.js");
		startScript(ns, "./corporation.js");
		if (
			ns.singularity
				.getOwnedAugmentations(false)
				.includes("The Blade's Simulacrum")
		) {
			startScript(ns, "./bladeburner.js");
		}
		startScript(ns, "./grafting.js");

		pick_action(ns);
		await ns.sleep(10500);
	}
}

function startScript(ns: NS, script: string) {
	if (!ns.isRunning(script)) {
		ns.run(script);
	}
}

function pick_action(ns: NS): boolean {
	if (factionWork(ns)) {
		return true;
	} else {
		return false;
	}
}
