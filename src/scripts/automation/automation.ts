import { NS } from "@ns";
import { get_timestamp } from "../logging/timestamp";
// SERVERS
import { nuke, backdoor, setup_tor } from "../servers/server_access";
import { manage_servers } from "../servers/server_upgrade";
// HACKING
import { deploy } from "../hacking/controller";
// MECHANICS
import { join_factions, faction_work, buy_augmentations } from "../mechanics/factions";
import { commit_crime, manage_gang } from "../mechanics/gang";
import { manage_corporation } from "../mechanics/corporation";
import { manage_bladeburner } from "../mechanics/bladeburner";

export function setup(ns: NS) {
	ns.disableLog("ALL");

	ns.print(get_timestamp() + " Launched main script");

	const window_size = ns.ui.windowSize();
	const tail_size = [window_size[0] / 3, window_size[1] / 3]; // width, height
	const tail_coords = [window_size[0] / 1.8625, window_size[1] / 175]; // x, y

	ns.ui.openTail();
	ns.ui.resizeTail(tail_size[0], tail_size[1]);
	ns.ui.moveTail(tail_coords[0], tail_coords[1]);
}

// RESTRICTION: MAX RAM COST = 32GB
// GOAL: COMMIT CRIME UNTIL HOME RAM UPGRADED
export function prep(ns: NS) {
	commit_crime(ns);
	ns.singularity.upgradeHomeRam();
}

// GOAL: BEAT BITNODE THROUGH HACKING
export async function hacking(ns: NS) {
	setup_tor(ns);
	nuke(ns);
	await backdoor(ns);
	deploy(ns);

	join_factions(ns);
	buy_augmentations(ns);

	manage_gang(ns, "Combat");
	// manage_corporation(ns);
	manage_servers(ns);
}

// GOAL: BEAT BITNODE THROUGH BLADEBURNER
export function bladeburner(ns: NS) {
	if (!ns.bladeburner.joinBladeburnerDivision() || !ns.gang.inGang()) {
		commit_crime(ns);
	}

	var owned_sf = ns.singularity.getOwnedSourceFiles();
	var sf7 = owned_sf.filter((a) => a.n == 7);
	var sf7_lvl = sf7.length > 0 ? sf7[0].lvl : 0;

	manage_gang(ns, "Combat");
	if (ns.gang.inGang() || sf7_lvl == 3) {
		manage_bladeburner(ns);
	}
}
