import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	const SCRIPT_PATH = "../hacking/actions/hack.js";
	var script_ram = ns.getScriptRam(SCRIPT_PATH);

	var available_ram =
		ns.getServerMaxRam("server_01") - ns.getServerUsedRam("server_01");
	var possible_threads = Math.floor(available_ram / script_ram);
	while (true) {
		ns.exec(SCRIPT_PATH, "server_01", possible_threads, "n00dles");
		await ns.sleep(1000);
	}
}
