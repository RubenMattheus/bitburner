import { NS } from "@ns";
import { get_timestamp } from "../logging/timestamp";

export function manage_corporation(ns: NS) {
	if (!ns.corporation.hasCorporation() && ns.corporation.canCreateCorporation(true)) {
		ns.corporation.createCorporation("Korporation", true);
		ns.print(get_timestamp() + " Created corporation");
	}
}

export function bribe(ns: NS, faction: string, money: number) {
	if (
		ns.corporation.getCorporation().valuation >
			ns.corporation.getConstants().bribeThreshold &&
		ns.getPlayer().factions.includes(faction)
	) {
		ns.corporation.bribe(faction, money);
	}
}
