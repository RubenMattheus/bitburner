import { NS } from "@ns";
// LOGGING
import { setup_log } from "./setup-log";
// MECHANICS
import { commit_crime, manage_gang } from "../mechanics/gang";
import { manage_bladeburner } from "../mechanics/bladeburner";

export async function main(ns: NS): Promise<void> {
	setup_log(ns);

	while (true) {
		bladeburner(ns);
		await ns.sleep(10200);
	}
}

// GOAL: BEAT BITNODE THROUGH BLADEBURNER
export function bladeburner(ns: NS) {
	manage_bladeburner(ns);
}
