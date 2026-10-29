import { NS } from "@ns";
import { commitCrime } from "../mechanics/gang";

/**
 * Commits crime and raises home RAM
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	function prep() {
		commitCrime(ns);
		if (ns.getServerMaxRam("home") < 256) {
			ns.singularity.upgradeHomeRam();
		}
	}

	while (true) {
		prep();
		await ns.sleep(10200);
	}
}
