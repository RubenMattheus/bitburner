import { NS } from "@ns";
import { setupLog } from "./logging/setup-log";
import { getTimestamp } from "./logging/timestamp";
import {
	serverBackdoorManager,
	singularityManager,
} from "./mechanics/singularity";
import { hackingController } from "./hacking/controller";
import { hacknetManager } from "./mechanics/hacknet";

export async function main(ns: NS): Promise<void> {
	setupLog(ns, true, 2.4, 0.1);
	ns.ui.setTailTitle("BitNode start");

	const ramNeeded =
		ns.getScriptRam(`./main.js`) + ns.getScriptRam(`./full.js`);

	ns.print(
		` - Current 'home' RAM: ${ns.format.ram(ns.getServerMaxRam("home"))}`,
	);
	ns.print(` - Needed 'home' RAM ${ns.format.ram(ramNeeded)}`);
	ns.print(
		` - BitNode start script RAM: ${ns.format.ram(ns.getScriptRam("./lite.js"))}`,
	);

	await ns.sleep(5000);

	const earlygame = new earlygameManager(ns, "Combat");

	const hacking = new hackingController(ns);
	const singularity = new singularityManager(ns);
	const backdoor = new serverBackdoorManager(ns, false);
	const hacknet = new hacknetManager(ns);

	while (ns.getServerMaxRam() < ramNeeded) {
		earlygame.tick(ns);

		hacking.tick(ns);
		singularity.tick(ns);
		await backdoor.tick(ns);
		hacknet.tick(ns);

		await ns.sleep(10500);
	}

	ns.atExit(() => ns.ui.closeTail());
	ns.run("./main.js");
}

class earlygameManager {
	gangType: string;

	constructor(ns: NS, type: string) {
		this.gangType = type;
	}

	tick(ns: NS) {
		this.createGang(ns);
		this.joinBladeburner(ns);
	}

	log(ns: NS, message: string) {
		ns.print(`${getTimestamp()} (Earlygame) ${message}`);
	}

	createGang(ns: NS) {
		this.gangType == "Hacking"
			? ns.gang.createGang("NiteSec")
			: ns.gang.createGang("Slum Snakes");
	}

	joinBladeburner(ns: NS) {
		const inDivision = ns.bladeburner.joinBladeburnerDivision();
		if (inDivision) {
			ns.bladeburner.joinBladeburnerFaction();
			this.startBladeburnerTraining(ns);
		}
		return inDivision;
	}

	startBladeburnerTraining(ns: NS) {
		if (ns.bladeburner.getCurrentAction()?.name != "Training") {
			return ns.bladeburner.startAction("General", "Training");
		} else {
			return true;
		}
	}
}
