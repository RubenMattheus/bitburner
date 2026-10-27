import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	const SCRIPTS = [
		"scripts/automation/U32.js",
		"scripts/automation/U64.js",
		"scripts/automation/U128.js",
		"scripts/automation/U256.js",
	];

	var main_ram = ns.getScriptRam("./main.js");

	ns.tprint("--- SCRIPT OVERVIEW (main script is " + main_ram + "GB) ---");

	for (var script of SCRIPTS) {
		var script_name = script.split("/")[2];
		var target_ram = Number(script.split("U")[1].split(".")[0]);
		var script_ram = ns.getScriptRam(script);
		var remaining_ram = Number((target_ram - (script_ram + main_ram)).toFixed(2));
		ns.tprint(
			script_name +
				":\t" +
				script_ram +
				"GB (" +
				Math.abs(remaining_ram).toFixed(2) +
				String(remaining_ram > 0 ? "GB left)" : "GB needed)"),
		);
	}
}
