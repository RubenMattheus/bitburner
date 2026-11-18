import { NS } from "@ns";
import { managerClass } from "../library/manager";

export class graftingManager extends managerClass {
	constructor(ns: NS) {
		super(ns, "Grafting");
	}

	tick(ns: NS) {
		if (!this.implantOwned(ns)) {
			this.installImplant(ns);
		} else {
			this.graft(ns);
		}
	}

	graft(ns: NS): boolean {
		const nextAugmentation = this.getUnavailableAugmentations(ns)[0];
		if (this.implantOwned(ns)) {
			if (ns.singularity.getCurrentWork()?.type != "GRAFTING") {
				if (ns.getPlayer().city != "New Tokyo") {
					ns.singularity.travelToCity("New Tokyo");
				}
				if (ns.grafting.graftAugmentation(nextAugmentation)) {
					this.log(ns, `Started grafting ${nextAugmentation}`);
					return true;
				} else {
					return false;
				}
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	implantOwned(ns: NS) {
		return ns.singularity
			.getOwnedAugmentations()
			.includes("violet Congruity Implant");
	}

	installImplant(ns: NS) {
		if (
			ns.getPlayer().money >
				ns.grafting.getAugmentationGraftPrice(
					"violet Congruity Implant",
				) &&
			ns.singularity.getCurrentWork()?.type != "GRAFTING"
		) {
			if (ns.getPlayer().city != "New Tokyo") {
				ns.singularity.travelToCity("New Tokyo");
			}
			if (ns.grafting.graftAugmentation("violet Congruity Implant")) {
				this.log(ns, `Started grafting violet Congruity Implant`);
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	}

	getUnavailableAugmentations(ns: NS) {
		return ns.grafting
			.getGraftableAugmentations()
			.filter((a) =>
				ns.singularity
					.getAugmentationFactions(a)
					.every((f) => !ns.getPlayer().factions.includes(f)),
			)
			.sort(
				(a, b) =>
					ns.grafting.getAugmentationGraftPrice(a) -
					ns.grafting.getAugmentationGraftPrice(b),
			);
	}
}

// export async function main(ns: NS): Promise<void> {
// 	let alertString = `GRAFTING OVERVIEW`;

// 	const unavailableAugmentations = getUnavailableAugmentations(ns);

// 	alertString = alertString.concat(
// 		`\n	${unavailableAugmentations.length} augmentations currently only available through grafting:`,
// 	);

// 	for (let a of unavailableAugmentations) {
// 		const graftPrice = ns.grafting.getAugmentationGraftPrice(a);
// 		alertString = alertString.concat(
// 			`\n ${a} (${ns.format.number(graftPrice)})`,
// 		);
// 	}

// 	ns.alert(alertString);
// }
