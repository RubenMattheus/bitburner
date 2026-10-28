import { NS } from "@ns";
// LOGGING
import { setup_log } from "./setup-log";
// SERVERS
import { setup_tor, nuke, backdoor } from "../servers/server-access";
import { manage_servers } from "../servers/server-upgrade";
// HACKING
import { deploy } from "../hacking/controller";
// MECHANICS
import { join_factions, buy_augmentations } from "../mechanics/factions";

export async function main(ns: NS): Promise<void> {
	setup_log(ns);

	while (true) {
		await hacking(ns);
		await ns.sleep(10200);
	}
}

// GOAL: BEAT BITNODE THROUGH HACKING
export async function hacking(ns: NS) {
	setup_tor(ns);
	nuke(ns);
	await backdoor(ns);
	deploy(ns);

	join_factions(ns);
	buy_augmentations(ns);

	manage_servers(ns);
}
