import { NS } from "@ns";
import { buyAugmentations, buyLast } from "./mechanics/factions";

/**
 * Resets the game by purchasing augmentations, waiting for a countdown, and then installing augmentations.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	buyAugmentations(ns);
	buyLast(ns);

	ns.tprint("Resetting in:");
	for (let i = 20; i > 0; i--) {
		ns.tprint(i);
		await ns.sleep(1000);
	}

	buyLast(ns);
	ns.singularity.installAugmentations("./main.js");
}
