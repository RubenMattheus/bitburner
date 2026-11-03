import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	let alertString = "GRAFTING OVERVIEW";

	const unavailableAugmentations = getUnavailableAugmentations(ns);

	alertString = alertString.concat(
		"\n" +
			unavailableAugmentations.length +
			" augmentations currently only available through grafting:",
	);

	for (let a of unavailableAugmentations) {
		const graftPrice = ns.grafting.getAugmentationGraftPrice(a);
		alertString = alertString.concat(
			"\n" + a + " (" + ns.format.number(graftPrice) + ")",
		);
	}

	ns.alert(alertString);
}

export function manageGrafting(ns: NS) {
	if (!implantOwned(ns)) {
		installImplant(ns);
	} else {
		graft(ns);
	}
}

function graft(ns: NS): boolean {
	if (implantOwned(ns)) {
		if (ns.singularity.getCurrentWork()?.type != "GRAFTING") {
			if (ns.getPlayer().city != "New Tokyo") {
				ns.singularity.travelToCity("New Tokyo");
			}
			return ns.grafting.graftAugmentation(getUnavailableAugmentations(ns)[0]);
		} else {
			return true;
		}
	} else {
		return false;
	}
}

function implantOwned(ns: NS) {
	return ns.singularity.getOwnedAugmentations().includes("violet Congruity Implant");
}

function installImplant(ns: NS) {
	if (
		ns.getPlayer().money >
			ns.grafting.getAugmentationGraftPrice("violet Congruity Implant") &&
		ns.singularity.getCurrentWork()?.type != "GRAFTING"
	) {
		if (ns.getPlayer().city != "New Tokyo") {
			ns.singularity.travelToCity("New Tokyo");
		}
		return ns.grafting.graftAugmentation("violet Congruity Implant");
	} else {
		return true;
	}
}

function getUnavailableAugmentations(ns: NS) {
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
