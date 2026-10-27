import { NS } from "@ns";
import { setup, hacking } from "./automation";

export async function main(ns: NS): Promise<void> {
	setup(ns);

	while (true) {
		hacking(ns);
		await ns.sleep(10200);
	}
}
