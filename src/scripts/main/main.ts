import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	ns.run("./hacking.js");
	ns.run("./gang.js");
	ns.run("./bladeburner.js");
}

export async function pick_goal(ns: NS) {
	// TODO
}

export async function get_sf7_level(ns: NS) {
	var owned_sf = ns.singularity.getOwnedSourceFiles();
	var sf7 = owned_sf.filter((a) => a.n == 7);
	var sf7_lvl = sf7.length > 0 ? sf7[0].lvl : 0;

	return sf7_lvl;
}
