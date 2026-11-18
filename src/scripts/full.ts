import { NS } from "@ns";
import { setupLog } from "./logging/setup-log";
import { hackingController } from "./hacking/controller"; // bn1
import { serverManager } from "./mechanics/cloud-servers"; // bn1 (2)
import { gangManager } from "./mechanics/gang"; // bn2
import { corporationManager } from "./mechanics/corporation"; // bn3
import {
	serverBackdoorManager,
	singularityManager,
} from "./mechanics/singularity"; // bn4
import { factionManager } from "./mechanics/factions"; // bn4 (2)
import { bladeburnerManager } from "./mechanics/bladeburner"; // bn6
import { hacknetManager } from "./mechanics/hacknet"; // bn9
import { sleeveManager } from "./mechanics/sleeve"; // bn10
import { graftingManager } from "./mechanics/grafting"; // bn10 (2)

export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 2.4, 0.1);
	ns.ui.setTailTitle("Log");

	await ns.sleep(5000);

	const hacking = new hackingController(ns, 0.9);
	const cloud = new serverManager(ns, 32);
	const gang = new gangManager(ns, "Combat");
	const corporation = new corporationManager(ns);
	const singularity = new singularityManager(ns);
	const backdoor = new serverBackdoorManager(ns, false);
	const faction = new factionManager(ns);
	const bladeburner = new bladeburnerManager(ns);
	const hacknet = new hacknetManager(ns);
	const sleeve = new sleeveManager(ns);
	const grafting = new graftingManager(ns);

	while (true) {
		hacking.tick(ns);
		cloud.tick(ns);
		gang.tick(ns);
		corporation.tick(ns);
		singularity.tick(ns);
		await backdoor.tick(ns);
		faction.tick(ns);
		bladeburner.tick(ns);
		hacknet.tick(ns);
		sleeve.tick(ns);
		grafting.tick(ns);

		await ns.sleep(10500);
	}
}
