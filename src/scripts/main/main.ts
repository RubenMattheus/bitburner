import { NS } from "@ns";
import { commit_crime } from "../mechanics/gang";

export async function main(ns: NS): Promise<void> {
	ns.run("./hacking.js");
	ns.run("./gang.js");
	if (
		ns.singularity
			.getOwnedAugmentations(false)
			.includes("The Blade's Simulacrum") ||
		ns.gang.inGang()
	) {
		ns.run("./bladeburner.js");
	}
}

export async function pick_action(ns: NS) {
	if (!ns.gang.inGang()) {
		commit_crime(ns);
	}
}
