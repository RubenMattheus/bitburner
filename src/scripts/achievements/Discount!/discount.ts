import { NS } from "@ns";
import { find_server } from "../../servers/server-scan";

export async function main(ns: NS): Promise<void> {
	ns.tprint(find_server(ns, "powerhouse-fitness"));
}
