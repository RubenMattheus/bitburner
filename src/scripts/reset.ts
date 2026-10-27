import { NS } from "@ns";
import { buy_augmentations, buy_last } from "./mechanics/factions";

export async function main(ns: NS): Promise<void> {
	buy_augmentations(ns);
	buy_last(ns);

	ns.tprint("Resetting in:");
	for (let i = 20; i > 0; i--) {
		ns.tprint(i);
		await ns.sleep(1000);
	}

	buy_last(ns);
	ns.singularity.installAugmentations("./main.js");
}
