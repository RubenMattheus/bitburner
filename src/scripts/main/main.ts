import { NS } from "@ns";
import { commitCrime } from "../mechanics/gang";

export async function main(ns: NS): Promise<void> {
	ns.run("./hacking.js");
	ns.run("./gang.js");
	if (
		ns.singularity.getOwnedAugmentations(false).includes("The Blade's Simulacrum")
	) {
		ns.run("./bladeburner.js");
	}
}

export async function pick_action(ns: NS) {
	if (!ns.gang.inGang()) {
		commitCrime(ns);
	}
}
