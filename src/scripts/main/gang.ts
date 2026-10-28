import { NS } from "@ns";
// LOGGING
import { setup_log } from "./setup-log";
// MECHANICS
import { commit_crime, manage_gang } from "../mechanics/gang";

export async function main(ns: NS): Promise<void> {
	setup_log(ns);

	while (true) {
		gang(ns);
		await ns.sleep(10200);
	}
}

// GOAL: MAKE MONEY THROUGH GANG
export function gang(ns: NS) {
	if (!ns.gang.inGang()) {
		commit_crime(ns);
	}
	manage_gang(ns, "Combat");
}
