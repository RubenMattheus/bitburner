import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	if (ns.getServerMaxRam() < 256) {
		ns.run("./main/earlygame.js");
	} else {
		ns.run("./main/main.js");
	}
}
