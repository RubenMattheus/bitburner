import { NS } from "@ns";
import { get_timestamp } from "./logging/timestamp";

export async function main(ns: NS): Promise<void> {
	var goal = ns.args.length > 0 ? ns.args[0] : "bladeburner";

	ns.tprint(get_timestamp() + " Running main script in:");
	for (let i = 10; i > 0; i--) {
		ns.tprint(i);
		await ns.sleep(1000);
	}

	ns.exec("scripts/automation/prep.js", "home", 1, goal);
}
