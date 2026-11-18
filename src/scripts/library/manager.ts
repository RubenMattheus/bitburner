import { NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";

export class managerClass {
	name: string;

	constructor(ns: NS, name: string) {
		this.name = name;
	}

	log(ns: NS, message: string) {
		ns.print(`${getTimestamp()} (${this.name}) ${message}`);
	}

	writePort(ns: NS, portNumber: number, data: any) {
		ns.clearPort(portNumber);
		ns.writePort(portNumber, data);
	}

	readPort(ns: NS, portNumber: number) {
		const portRead = ns.peek(portNumber);
		if (portRead == "NULL PORT DATA") {
			this.log(ns, `Invalid port read on port ${portNumber}`);
			return "NULL PORT DATA";
		} else {
			return portRead;
		}
	}
}
