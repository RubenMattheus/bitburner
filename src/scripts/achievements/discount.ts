import { NS } from "@ns";
import { find_server } from "../servers/server_scan";

export async function main(ns: NS): Promise<void> {
	ns.tprint(find_server(ns, "powerhouse-fitness"));
}
