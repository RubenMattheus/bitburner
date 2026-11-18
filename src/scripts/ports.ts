import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	let alertString = `PORTS OVERVIEW`;

	for (let i = 1; i < 200; i++) {
		const portData = ns.peek(i);
		if (portData != "NULL PORT DATA") {
			alertString = alertString.concat(`Port ${i}: ${portData}`);
		}
	}

	ns.alert(alertString);
}
