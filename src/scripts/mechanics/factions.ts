import { NS, FactionName } from "@ns";

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

	const unique = getUniqueAugmentations(ns, getRemainingAugmentations(ns));
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

// ----------------- //
// FACTION FUNCTIONS //
// ----------------- //

/**
 * Join faction if faction either has no enemies or is the next faction in the faction order.
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function joinFactions(ns: NS) {
	const invitations = ns.singularity.checkFactionInvitations();

	for (let f of invitations) {
		if (ns.singularity.getFactionEnemies(f).length == 0) {
			ns.singularity.joinFaction(f);
		} else if (f == getNextFaction(ns)) {
			ns.singularity.joinFaction(f);
		}
	}
}

/**
 * Travels to all cities in a specified region
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} region - The region to travel to ("west", "center", or "east").
 */
export function travel(ns: NS, region: string) {
	switch (region) {
		case "west":
			ns.singularity.travelToCity("Sector-12");
			ns.singularity.travelToCity("Aevum");
			break;
		case "center":
			ns.singularity.travelToCity("Volhaven");
			break;
		case "east":
			ns.singularity.travelToCity("Chongqing");
			ns.singularity.travelToCity("New Tokyo");
			ns.singularity.travelToCity("Ishima");
			break;
	}
}

/**
 * Sets player action to work for the next faction in the faction order if the player has not yet reached 150 favor with that faction.
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function factionWork(ns: NS) {
	const target = getNextFaction(ns) as FactionName;
	const totalFavor =
		ns.singularity.getFactionFavor(target) +
		ns.singularity.getFactionFavorGain(target);
	if (totalFavor < 150) {
		ns.singularity.workForFaction(target, "hacking", false);
	}
}

/**
 * Returns the next faction in the faction order that has unowned augmentations, excluding the player's current gang faction.
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {string} The name of the next faction in the faction order that has unowned augmentations.
 */
export function getNextFaction(ns: NS): string {
	const factionOrder = [
		"CyberSec",
		"NiteSec",
		"The Black Hand",
		"BitRunners",
		"Daedalus",
	];
	if (
		ns.gang.inGang() &&
		factionOrder.includes(ns.gang.getGangInformation().faction)
	) {
		factionOrder.splice(
			factionOrder.indexOf(ns.gang.getGangInformation().faction),
			1,
		);
	}

	const augSelection = getRemainingAugmentations(ns);

	for (let f of factionOrder) {
		if (
			ns.singularity
				.getAugmentationsFromFaction(f as FactionName)
				.some((a) => augSelection.includes(a))
		) {
			return f;
		}
	}
	return factionOrder[factionOrder.length - 1];
}

/**
 * Returns the faction with the highest reputation, excluding the player's current gang faction.
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {string} The name of the faction with the highest reputation.
 */
export function getHighestFaction(ns: NS): string {
	const factions = ns.getPlayer().factions;

	if (ns.gang.inGang()) {
		const index = factions.indexOf(ns.gang.getGangInformation().faction);
		if (index != -1) {
			factions.splice(index, 1);
		}
	}

	return factions
		.sort(function (a, b) {
			return ns.singularity.getFactionRep(a) - ns.singularity.getFactionRep(b);
		})
		.reverse()[0];
}

// ---------------------- //
// AUGMENTATION FUNCTIONS //
// ---------------------- //

/**
 * Returns the list of augmentations that are not yet owned by the player.
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {string[]} The list of augmentations that are not yet owned by the player.
 */
export function getRemainingAugmentations(ns: NS): string[] {
	const aug: string[] = [];

	for (let f of FACTIONS) {
		for (let a of ns.singularity.getAugmentationsFromFaction(f as FactionName)) {
			if (ns.singularity.getOwnedAugmentations(true).includes(a)) {
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
export function getAugmentationSelection(ns: NS, type: string): string[] {
	const aug = getRemainingAugmentations(ns);

	function selectHacking(a: string) {
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

	function selectCombat(a: string) {
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

	function selectReputation(a: string) {
		return ns.singularity.getAugmentationStats(a).faction_rep > 1;
	}

	const specialAug = ["The Red Pill", "Neuroreceptor Management Implant"];

	if (type == "Hacking") {
		return aug.filter((a) => selectHacking(a));
	} else if (type == "Combat") {
		return aug.filter((a) => selectCombat(a));
	} else if (type == "Rep") {
		return aug.filter((a) => selectReputation(a));
	} else if (type == "Special") {
		return specialAug;
	} else {
		return aug;
	}
}

/**
 * Returns the list of unique augmentations that are only available from a single faction.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string[]} aug - The list of augmentations to filter.
 * @returns {string[]} The list of unique augmentations that are only available from a single faction.
 */
export function getUniqueAugmentations(ns: NS, aug: string[]): string[] {
	return aug.filter((a) => ns.singularity.getAugmentationFactions(a).length == 1);
}

/**
 * Buys augmentations from a specified faction.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} faction - The faction from which to buy augmentations.
 * @param {boolean} continueBuying - Whether to continue buying augmentations if a purchase fails.
 */
export function buyAugmentations(
	ns: NS,
	faction: string = "",
	continueBuying: boolean = false,
) {
	let factionName = faction;
	if (factionName == "") {
		factionName = getNextFaction(ns);
	}

	function getAugToBuy(): string[] {
		const augSelection = getRemainingAugmentations(ns);
		return ns.singularity
			.getAugmentationsFromFaction(factionName as FactionName)
			.filter((a) => augSelection.includes(a));
	}

	const aug = getAugToBuy().sort(function (a, b) {
		return (
			ns.singularity.getAugmentationPrice(b) -
			ns.singularity.getAugmentationPrice(a)
		);
	});

	const inGang = ns.gang.inGang();

	while (aug.length > 0) {
		const nextAug = aug[0];
		if (nextAug == "NeuroFlux Governor") {
			aug.shift();
			continue;
		}
		const preReq = ns.singularity
			.getAugmentationPrereq(nextAug)
			.sort(function (a, b) {
				return (
					ns.singularity.getAugmentationPrice(b) -
					ns.singularity.getAugmentationPrice(a)
				);
			});
		const owned = ns.singularity.getOwnedAugmentations(true);
		for (let a of preReq.filter((a) => !owned.includes(a))) {
			if (
				!ns.singularity.purchaseAugmentation(factionName as FactionName, a) &&
				inGang
			) {
				ns.singularity.purchaseAugmentation(
					ns.gang.getGangInformation().faction,
					a,
				);
			}
		}
		let purchased = ns.singularity.purchaseAugmentation(
			factionName as FactionName,
			nextAug,
		);
		if (!purchased && inGang) {
			purchased = ns.singularity.purchaseAugmentation(
				ns.gang.getGangInformation().faction,
				nextAug,
			);
		} // purchasing augment failed -> try again in gang faction
		if (purchased || continueBuying) {
			aug.shift();
			continue;
		} // move to next aug if previous purchase succeeded or if continue buying == true
		else {
			return;
		} // purchasing failed so stop execution
	}
}

/**
 * Purchase last affordable augmentations from the highest faction and NeuroFlux Governors until money runs out.
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function buyLast(ns: NS) {
	if (ns.gang.inGang()) {
		const gangFaction = ns.gang.getGangInformation().faction;
		buyAugmentations(ns, gangFaction, true);
	}

	const highestFaction = getHighestFaction(ns);
	while (
		ns.getPlayer().money >
			ns.singularity.getAugmentationPrice("NeuroFlux Governor") &&
		ns.singularity.getFactionRep(highestFaction as FactionName) >
			ns.singularity.getAugmentationRepReq("NeuroFlux Governor")
	) {
		ns.singularity.purchaseAugmentation(
			highestFaction as FactionName,
			"NeuroFlux Governor",
		);
	}
}
