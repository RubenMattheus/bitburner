import { NS, FactionName } from "@ns";
import { getTimestamp } from "../logging/timestamp";

export function manageCorporation(ns: NS) {
	if (!ns.corporation.hasCorporation() && ns.corporation.canCreateCorporation(true)) {
		ns.corporation.createCorporation("Korporation", true);
		ns.print(getTimestamp() + " Created corporation");
	}
}

export function bribe(ns: NS, faction: string, money: number) {
	if (
		ns.corporation.getCorporation().valuation >
			ns.corporation.getConstants().bribeThreshold &&
		ns.getPlayer().factions.includes(faction as FactionName)
	) {
		ns.corporation.bribe(faction as FactionName, money);
	}
}
