import { NS, FactionName } from "@ns";
import { getTimestamp } from "../logging/timestamp";

const earlygameFactions = ["Tian Di Hui", "Netburners", "Shadows of Anarchy"];
const cityFactions = [
	"Sector-12",
	"Chongqing",
	"New Tokyo",
	"Ishima",
	"Aevum",
	"Volhaven",
];
const hackingGroups = ["CyberSec", "NiteSec", "The Black Hand", "BitRunners"];
const megacorporations = [
	"ECorp",
	"MegaCorp",
	"KuaiGong International",
	"Four Sigma",
	"NWO",
	"Blade Industries",
	"OmniTek Incorporated",
	"Bachman & Associates",
	"Clarke Incorporated",
	"Fulcrum Secret Technologies",
];
const criminalOrganizations = [
	"Slum Snakes",
	"Tetrads",
	"Silhouette",
	"Speakers for the Dead",
	"The Dark Army",
	"The Syndicate",
];
const lategameFactions = ["The Covenant", "Illuminati", "Daedalus"];
const endgameFactions = ["Bladeburners", "Church of the Machine God"];

const FACTIONS = earlygameFactions.concat(
	cityFactions,
	hackingGroups,
	megacorporations,
	criminalOrganizations,
	lategameFactions,
	endgameFactions,
);

/**
 * Prints all unowned augmentations, either grouped by unique factions that sell them or by type (Hacking, Combat, Rep, Special).
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	ns.tprint("--- UNIQUE ---");

	const unique = getUniqueAugmentations(ns, getAugmentations(ns, false));
	unique.sort(function (a, b) {
		return (
			ns.singularity.getAugmentationRepReq(a) -
			ns.singularity.getAugmentationRepReq(b)
		);
	});
	const uniqueMap = unique.map((a) => ns.singularity.getAugmentationFactions(a)[0]);

	for (let f of uniqueMap.filter((item, index) => uniqueMap.indexOf(item) == index)) {
		ns.tprint("-| " + f + " |-");
		ns.tprint(
			String(
				unique.filter((a) => ns.singularity.getAugmentationFactions(a)[0] == f),
			),
		);
	}

	ns.tprint("--- GENERAL ---");

	function printList(type: string) {
		const list = getAugmentationSelection(ns, type).filter(
			(a) => !unique.includes(a),
		);
		list.sort(function (a, b) {
			return (
				ns.singularity.getAugmentationRepReq(a) -
				ns.singularity.getAugmentationRepReq(b)
			);
		});
		if (list.length > 0) {
			ns.tprint("-| " + type + " |-");
			for (let a of list) {
				ns.tprint(a + " : " + ns.singularity.getAugmentationFactions(a));
			}
		}
	}

	printList("Hacking");
	printList("Combat");
	printList("Rep");
}

export async function manageFactions(ns: NS, minAugmentationAmount: number) {
	joinCityFactions(ns);
	acceptInvites(ns);
	purchaseAvailableAugmentations(ns, minAugmentationAmount);
	await installAugmentations(ns, minAugmentationAmount);
}

// ----------------- //
// FACTION FUNCTIONS //
// ----------------- //

export function getNextFaction(ns: NS) {
	const factions = ns.getPlayer().factions;
	const toExclude = ["Bladeburners"];

	if (ns.gang.inGang()) {
		toExclude.push(ns.gang.getGangInformation().faction);
	}

	return factions
		.filter(
			(f) =>
				!toExclude.includes(f) &&
				getRemainingAugmentationsFromFaction(ns, f).length > 0 &&
				ns.singularity.getFactionFavor(f) +
					ns.singularity.getFactionFavorGain(f) <
					150,
		)
		.sort(
			(a, b) =>
				getRemainingAugmentationsFromFaction(ns, b).length -
				getRemainingAugmentationsFromFaction(ns, a).length,
		)[0];
}

export function factionWork(ns: NS): boolean {
	if (ns.singularity.workForFaction(getNextFaction(ns), "security", false)) {
		return true;
	} else if (ns.singularity.workForFaction(getNextFaction(ns), "field", false)) {
		return true;
	} else if (ns.singularity.workForFaction(getNextFaction(ns), "hacking", false)) {
		return true;
	} else {
		return false;
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

/**
 * Returns the list of augmentations with the option to exclude already owned augmentations.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {boolean} includeOwned - Whether the player's augmentations should be included or excluded
 * @returns {string[]} The list of augmentations that are not yet owned by the player.
 */
function getAugmentations(ns: NS, includeOwned: boolean = true): string[] {
	const aug: string[] = [];

	for (let f of FACTIONS) {
		for (let a of ns.singularity.getAugmentationsFromFaction(f as FactionName)) {
			if (
				ns.singularity.getOwnedAugmentations(true).includes(a) &&
				includeOwned == false
			) {
				continue;
			}

			aug.push(a);
		}
	}
	return aug
		.filter((item, index) => aug.indexOf(item) == index)
		.sort(function (a, b) {
			return (
				ns.singularity.getAugmentationRepReq(a) -
				ns.singularity.getAugmentationRepReq(b)
			);
		});
}

/**
 * Returns the list of augmentations of a specific type that are not yet owned by the player.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} type - The type of augmentations to select.
 * @returns {string[]} The list of augmentations of the specified type that are not yet owned by the player.
 */
function getAugmentationSelection(ns: NS, type: string): string[] {
	const augmentations = getAugmentations(ns, false);

	function hackingFilter(a: string) {
		const modifiers = ns.singularity.getAugmentationStats(a);
		return (
			modifiers.hacking_chance > 1 ||
			modifiers.hacking_speed > 1 ||
			modifiers.hacking_money > 1 ||
			modifiers.hacking_grow > 1 ||
			modifiers.hacking > 1 ||
			modifiers.hacking_exp > 1
		);
	}

	function combatFilter(a: string) {
		const modifiers = ns.singularity.getAugmentationStats(a);
		return (
			modifiers.strength > 1 ||
			modifiers.strength_exp > 1 ||
			modifiers.defense > 1 ||
			modifiers.defense_exp > 1 ||
			modifiers.dexterity > 1 ||
			modifiers.dexterity_exp > 1 ||
			modifiers.agility > 1 ||
			modifiers.agility_exp > 1
		);
	}

	function reputationFilter(a: string) {
		return ns.singularity.getAugmentationStats(a).faction_rep > 1;
	}

	const specialAugmentations = ["The Red Pill", "Neuroreceptor Management Implant"];

	switch (type) {
		case "Hacking":
			return augmentations.filter((a) => hackingFilter(a));
		case "Combat":
			return augmentations.filter((a) => combatFilter(a));
		case "Reputation":
			return augmentations.filter((a) => reputationFilter(a));
		case "Special":
			return specialAugmentations;
		default:
			return augmentations;
	}
}

/**
 * Returns the list of unique augmentations that are only available from a single faction.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string[]} aug - The list of augmentations to filter.
 * @returns {string[]} The list of unique augmentations that are only available from a single faction.
 */
function getUniqueAugmentations(ns: NS, aug: string[]): string[] {
	return aug.filter((a) => ns.singularity.getAugmentationFactions(a).length == 1);
}

function getRemainingAugmentationsFromFaction(
	ns: NS,
	faction: string,
	includePurchased: boolean = true,
) {
	return ns.singularity
		.getAugmentationsFromFaction(faction as FactionName)
		.filter(
			(a) =>
				a != "NeuroFlux Governor" &&
				!ns.singularity.getOwnedAugmentations(includePurchased).includes(a),
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
						ns.singularity.getFactionRep(f as FactionName) && // player has enough reputation with the faction
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
					ns.singularity.purchaseAugmentation(f as FactionName, a);
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
			ns.singularity.purchaseAugmentation(
				NeurofluxFaction as FactionName,
				"NeuroFlux Governor",
			)
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
		ns.print(
			getTimestamp() +
				" Installing " +
				purchasedAugmentations +
				" augmentations in 5 seconds",
		);
		buyNeuroflux(ns);
		await ns.sleep(5000);
		ns.singularity.installAugmentations("../start.js");
	}
}
