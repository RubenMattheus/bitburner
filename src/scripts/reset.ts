import { NS } from "@ns";
import {
	purchaseAvailableAugmentations,
	installAugmentations,
} from "./mechanics/factions";

/**
 * Resets the game by purchasing augmentations, waiting for a countdown, and then installing augmentations.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	purchaseAvailableAugmentations(ns, 0);
	await installAugmentations(ns, 0);
}
