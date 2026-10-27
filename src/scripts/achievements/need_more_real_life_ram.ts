import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	const wait_ram = ns.getScriptRam("./helper/wait.js");

	for (let i = 0; i < 1000; i++) {
		try {
			ns.run("./helper/wait.js");
		} catch {
			ns.tprint(
				"Not enough RAM on home computer, need " +
					wait_ram * 1000 +
					" free RAM",
			);
			break;
		}
	}
}
