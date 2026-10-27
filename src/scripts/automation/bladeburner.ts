import { NS } from "@ns";
import { setup, bladeburner } from "./automation";

export async function main(ns: NS): Promise<void> {
	setup(ns);

	while (true) {
		bladeburner(ns);
		await ns.sleep(10200);
	}
}
