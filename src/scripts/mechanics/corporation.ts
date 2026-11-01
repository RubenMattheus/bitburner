import { NS, FactionName } from "@ns";
import { getTimestamp } from "../logging/timestamp";

export function manageCorporation(ns: NS) {
	if (!ns.corporation.hasCorporation()) {
		if (ns.corporation.canCreateCorporation(true)) {
			ns.corporation.createCorporation("Korporation", true);
			ns.print(getTimestamp() + " Created corporation");
		} else {
			return;
		}
	}

	manageIndustries(ns);
}

function manageIndustries(ns: NS) {
	const corp = ns.corporation.getCorporation();
	if (!corp.divisions.includes("AGRI")) {
		ns.corporation.expandIndustry("Agriculture", "AGRI");
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
