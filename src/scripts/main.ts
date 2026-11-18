import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	const ramNeeded =
		ns.getScriptRam(`./main.js`) + ns.getScriptRam(`./full.js`);

	if (ns.getServerMaxRam() < ramNeeded) {
		ns.run("./lite.js");
	} else {
		ns.scriptKill("./lite.js");
		ns.run("./full.js");
	}
}
