import { NS, FactionName } from "@ns";
import { managerClass } from "../library/manager";

export class corporationManager extends managerClass {
	constructor(ns: NS) {
		super(ns, "Corporation");
	}

	tick(ns: NS) {
		if (!ns.corporation.hasCorporation()) {
			if (ns.corporation.canCreateCorporation(true)) {
				if (ns.corporation.createCorporation("Korporation", true)) {
					this.log(ns, `Created corporation.`);
				}
			} else {
				return;
			}
		} else {
			this.manageIndustries(ns);
		}
	}

	manageIndustries(ns: NS) {
		const corp = ns.corporation.getCorporation();
		if (!corp.divisions.includes("AGRI")) {
			ns.corporation.expandIndustry("Agriculture", "AGRI");
		}
	}

	bribe(ns: NS, faction: string, money: number) {
		if (
			ns.corporation.getCorporation().valuation >
				ns.corporation.getConstants().bribeThreshold &&
			ns.getPlayer().factions.includes(faction as FactionName)
		) {
			ns.corporation.bribe(faction as FactionName, money);
		}
	}
}
