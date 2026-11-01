import { NS } from "@ns";
import { findServer } from "../servers/scan";

export async function main(ns: NS): Promise<void> {
	const functionCall = "a";
	ns.tprint(functionCall);

	ns.tprint(findServer(ns, "w0r1d_d43m0n").length == 1);
}
