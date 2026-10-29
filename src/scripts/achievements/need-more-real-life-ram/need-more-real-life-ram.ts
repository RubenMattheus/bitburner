import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	const wait_ram = ns.getScriptRam("../wait.ts");

	for (let i = 0; i < 1000; i++) {
		try {
			ns.run("../wait.ts");
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
