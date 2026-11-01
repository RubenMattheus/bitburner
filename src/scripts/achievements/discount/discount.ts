import { NS } from "@ns";
import { findServer } from "../../servers/scan";

export async function main(ns: NS): Promise<void> {
	ns.tprint(findServer(ns, "powerhouse-fitness"));
}
