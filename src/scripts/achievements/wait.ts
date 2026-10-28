import { NS } from "@ns";

export async function wait(ns: NS): Promise<void> {
	await ns.sleep(2 * 60 * 1000); // 2 minutes (make longer if achievement doesn't pop)
}
