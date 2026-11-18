import { NS } from "@ns";
import { findServer } from "../../library/shared";

export async function main(ns: NS): Promise<void> {
	ns.tprint(findServer(ns, "powerhouse-fitness"));
}
