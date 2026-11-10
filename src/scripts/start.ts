import { NS } from "@ns";
import { setupLog } from "./logging/setup-log";
import { manageSingularityLite } from "./mechanics/singularity";

export async function main(ns: NS): Promise<void> {
	const ramNeeded = 128;

	if (ns.getServerMaxRam("home") < ramNeeded) {
		setupLog(ns, true, 3, 8);
		ns.ui.setTailTitle("Start");

		await ns.sleep(5000);
	}

	while (ns.getServerMaxRam("home") < ramNeeded) {
		manageSingularityLite(ns);

		await ns.sleep(10500);
	}

	ns.ui.closeTail();
	ns.run("./main/main.js");
}
