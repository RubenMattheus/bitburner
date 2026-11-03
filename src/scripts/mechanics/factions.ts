import { NS, FactionName } from "@ns";

/**
 * Prints all unowned augmentations, either grouped by unique factions that sell them or by type (Hacking, Combat, Rep, Special).
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	let alertString = "FACTION OVERVIEW";

	const factions = Object.values(ns.enums.FactionName);
	const incompleteFactions = factions.filter(
		(f) => getRemainingAugmentationsFromFaction(ns, f).length > 0,
	);
	alertString = alertString.concat(
		"\n" + incompleteFactions.length + " factions with remaining augmentations:",
	);
	for (let f of incompleteFactions) {
		alertString = alertString.concat(
			"\n" + f + " (" + getRemainingAugmentationsFromFaction(ns, f) + ")",
		);
	}

	ns.alert(alertString);
}

export async function manageFactions(ns: NS, minAugmentationAmount: number) {
	joinCityFactions(ns);
	acceptInvites(ns);
	donateToFactions(ns);
	purchaseAvailableAugmentations(ns, minAugmentationAmount);
	await installAugmentations(ns, minAugmentationAmount);
}

// ----------------- //
// FACTION FUNCTIONS //
// ----------------- //

export function getIncompleteFactions(ns: NS): FactionName[] {
	const factions = ns.getPlayer().factions;
	const toExclude = ["Bladeburners"];

	if (ns.gang.inGang()) {
		toExclude.push(ns.gang.getGangInformation().faction);
	}

	return factions
		.filter(
			(f) =>
				!toExclude.includes(f) && // no special factions
				!sufficientFactionRep(ns, f) && // need more rep
				ns.singularity.getFactionFavor(f) +
					ns.singularity.getFactionFavorGain(f) <
					150, // can't donate to get more rep
		)
		.sort(
			(a, b) =>
				getRemainingAugmentationsFromFaction(ns, b).length -
				getRemainingAugmentationsFromFaction(ns, a).length,
		);
}

function sufficientFactionRep(ns: NS, faction: FactionName) {
	const remainingAugmentations = getRemainingAugmentationsFromFaction(
		ns,
		faction,
	).sort(
		(a, b) =>
			ns.singularity.getAugmentationRepReq(b) -
			ns.singularity.getAugmentationRepReq(a),
	);

	if (remainingAugmentations.length == 0) {
		return true;
	}

	return (
		ns.singularity.getFactionRep(faction) >
		ns.singularity.getAugmentationRepReq(remainingAugmentations[0])
	);
}

function donateToFactions(ns: NS) {
	const factions = ns.getPlayer().factions;
	const toExclude = ["Bladeburners"];

	if (ns.gang.inGang()) {
		toExclude.push(ns.gang.getGangInformation().faction);
	}

	const toDonate = factions.filter(
		(f) =>
			!toExclude.includes(f) &&
			!sufficientFactionRep(ns, f) &&
			ns.singularity.getFactionFavor(f) > 150,
	);

	for (let f of toDonate) {
		ns.singularity.donateToFaction(f, ns.getPlayer().money * 0.1);
	}
}

/**
 * Join faction if faction either has no enemies or is the next faction in the faction order.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function acceptInvites(ns: NS) {
	const invitations = ns.singularity.checkFactionInvitations();

	for (let f of invitations) {
		const factionAugmentations = getRemainingAugmentationsFromFaction(ns, f);
		if (
			ns.singularity.getFactionEnemies(f).length == 0 ||
			factionAugmentations.length > 0
		) {
			ns.singularity.joinFaction(f);
		}
	}
}

/**
 * Travels to all cities in a specified region
 *
 * @param {NS} ns - The Bitburner API object.
 */
function joinCityFactions(ns: NS) {
	const player = ns.getPlayer();
	const playerFactions = player.factions;
	const westCheck =
		getRemainingAugmentationsFromFaction(ns, "Sector-12", false).length > 0 ||
		getRemainingAugmentationsFromFaction(ns, "Aevum", false).length > 0;
	const centerCheck =
		getRemainingAugmentationsFromFaction(ns, "Volhaven", false).length > 0;
	const eastCheck =
		getRemainingAugmentationsFromFaction(ns, "Chongqing", false).length > 0 ||
		getRemainingAugmentationsFromFaction(ns, "New Tokyo", false).length > 0 ||
		getRemainingAugmentationsFromFaction(ns, "Ishima", false).length > 0;

	if (westCheck && player.money > 45e6) {
		if (!playerFactions.includes("Sector-12")) {
			ns.singularity.travelToCity("Sector-12");
			ns.singularity.joinFaction("Sector-12");
		}
		if (!playerFactions.includes("Aevum")) {
			ns.singularity.travelToCity("Aevum");
			ns.singularity.joinFaction("Aevum");
		}
	} else if (centerCheck && player.money > 55e6) {
		if (!playerFactions.includes("Volhaven")) {
			ns.singularity.travelToCity("Volhaven");
			ns.singularity.joinFaction("Volhaven");
		}
	} else if (eastCheck && player.money > 35e6) {
		if (!playerFactions.includes("Chongqing")) {
			ns.singularity.travelToCity("Chongqing");
			ns.singularity.joinFaction("Chongqing");
		}
		if (!playerFactions.includes("New Tokyo")) {
			ns.singularity.travelToCity("New Tokyo");
			ns.singularity.joinFaction("New Tokyo");
		}
		if (!playerFactions.includes("Ishima")) {
			ns.singularity.travelToCity("Ishima");
			ns.singularity.joinFaction("Ishima");
		}
	}

	if (
		!playerFactions.includes("Tian Di Hui") &&
		player.skills.hacking > 50 &&
		player.money > 2e9
	) {
		ns.singularity.travelToCity("Chongqing");
	}
}

// ---------------------- //
// AUGMENTATION FUNCTIONS //
// ---------------------- //

function getRemainingAugmentationsFromFaction(
	ns: NS,
	faction: FactionName,
	excludePurchased: boolean = true,
) {
	return ns.singularity
		.getAugmentationsFromFaction(faction)
		.filter(
			(a) =>
				a != "NeuroFlux Governor" &&
				!ns.singularity.getOwnedAugmentations(excludePurchased).includes(a),
		);
}

function getAvailableAugmentations(ns: NS) {
	const playerFactions = ns.getPlayer().factions;

	const augmentations: string[] = [];
	for (let f of playerFactions) {
		augmentations.push(
			...getRemainingAugmentationsFromFaction(ns, f).filter(
				(a) =>
					!augmentations.includes(a) && // augmentation is not already in the list
					ns.singularity
						.getAugmentationPrereq(a)
						.every((p) =>
							ns.singularity.getOwnedAugmentations(true).includes(p),
						) && // augmentation prerequisites are owned
					ns.singularity.getAugmentationRepReq(a) <=
						ns.singularity.getFactionRep(f) && // player has enough reputation with the faction
					ns.singularity.getAugmentationPrice(a) <= ns.getPlayer().money, // player has enough money
			),
		);
	}
	return augmentations.sort(
		(a, b) =>
			ns.singularity.getAugmentationPrice(b) -
			ns.singularity.getAugmentationPrice(a),
	);
}

export function purchaseAvailableAugmentations(ns: NS, minAmount: number) {
	const availableAugmentations = getAvailableAugmentations(ns);
	const purchasedAugmentations = ns.singularity
		.getOwnedAugmentations(true)
		.filter((a) => !ns.singularity.getOwnedAugmentations(false).includes(a));
	const playerFactions = ns
		.getPlayer()
		.factions.sort(
			(a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a),
		);

	if (availableAugmentations.length >= minAmount - purchasedAugmentations.length) {
		for (let a of availableAugmentations) {
			for (let f of playerFactions) {
				if (ns.singularity.getAugmentationFactions(a).includes(f)) {
					ns.singularity.purchaseAugmentation(f, a);
					break;
				}
			}
		}
	} else {
		return;
	}
}

function buyNeuroflux(ns: NS) {
	const NeurofluxFaction = ns
		.getPlayer()
		.factions.filter((f) =>
			ns.singularity.getAugmentationFactions("NeuroFlux Governor").includes(f),
		)
		.sort(
			(a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a),
		)[0];
	if (NeurofluxFaction) {
		while (
			ns.singularity.purchaseAugmentation(NeurofluxFaction, "NeuroFlux Governor")
		) {
			continue;
		}
	} else {
		return;
	}
}

export async function installAugmentations(ns: NS, minAmount: number) {
	const purchasedAugmentations = ns.singularity
		.getOwnedAugmentations(true)
		.filter((a) => !ns.singularity.getOwnedAugmentations(false).includes(a));

	if (purchasedAugmentations.length >= minAmount) {
		ns.alert(" Installed " + purchasedAugmentations.length + " augmentations");
		buyNeuroflux(ns);
		await ns.sleep(5000);
		ns.singularity.installAugmentations("/scripts/start.js");
	}
}
