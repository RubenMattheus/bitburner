import { NS } from "@ns";
import { get_timestamp } from "../logging/timestamp";

export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL");
	ns.ui.openTail();

	let karma = ns.heart.break().toFixed(2);
	while (Number(karma) > -54000) {
		if (karma != ns.heart.break().toFixed(2)) {
			karma = ns.heart.break().toFixed(2);
			ns.print(
				get_timestamp() +
					" Current karma: " +
					karma +
					" (" +
					((Number(karma) / 54000) * -100).toFixed(2) +
					"%)",
			);
		}

		await ns.sleep(3000);
	}
	ns.ui.closeTail();
	ns.scriptKill("./utils.js", "home");
}
