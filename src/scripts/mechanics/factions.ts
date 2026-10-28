import { NS, FactionName } from "@ns";

const EARLYGAME_FACTIONS = ["Tian Di Hui", "Netburners", "Shadows of Anarchy"];
const CITY_FACTIONS = [
	"Sector-12",
	"Chongqing",
	"New Tokyo",
	"Ishima",
	"Aevum",
	"Volhaven",
];
const HACKING_GROUPS = ["CyberSec", "NiteSec", "The Black Hand", "BitRunners"];
const MEGACORPORATIONS = [
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
const CRIMINAL_ORGANIZATIONS = [
	"Slum Snakes",
	"Tetrads",
	"Silhouette",
	"Speakers for the Dead",
	"The Dark Army",
	"The Syndicate",
];
const LATEGAME_FACTIONS = ["The Covenant", "Illuminati", "Daedalus"];
const ENDGAME_FACTIONS = ["Bladeburners", "Church of the Machine God"];

const FACTIONS = EARLYGAME_FACTIONS.concat(
	CITY_FACTIONS,
	HACKING_GROUPS,
	MEGACORPORATIONS,
	CRIMINAL_ORGANIZATIONS,
	LATEGAME_FACTIONS,
	ENDGAME_FACTIONS,
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

	var unique = get_unique_augmentations(ns, get_remaining_augmentations(ns));
	unique.sort(function (a, b) {
		return (
			ns.singularity.getAugmentationRepReq(a) -
			ns.singularity.getAugmentationRepReq(b)
		);
	});
	var unique_map = unique.map((a) => ns.singularity.getAugmentationFactions(a)[0]);

	for (var f of unique_map.filter(
		(item, index) => unique_map.indexOf(item) == index,
	)) {
		ns.tprint("-| " + f + " |-");
		ns.tprint(
			String(
				unique.filter((a) => ns.singularity.getAugmentationFactions(a)[0] == f),
			),
		);
	}

	ns.tprint("--- GENERAL ---");

	function print_list(type: string) {
		var list = get_augmentation_selection(ns, type).filter(
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
			for (var a of list) {
				ns.tprint(a + " : " + ns.singularity.getAugmentationFactions(a));
			}
		}
	}

	print_list("Hacking");
	print_list("Combat");
	print_list("Rep");
}

// ----------------- //
// FACTION FUNCTIONS //
// ----------------- //

/**
 * Join faction if faction either has no enemies or is the next faction in the faction order.
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function join_factions(ns: NS) {
	var invitations = ns.singularity.checkFactionInvitations();

	for (var f of invitations) {
		if (ns.singularity.getFactionEnemies(f).length == 0) {
			ns.singularity.joinFaction(f);
		} else if (f == get_next_faction(ns)) {
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
export function faction_work(ns: NS) {
	var target = get_next_faction(ns) as FactionName;
	var total_favor =
		ns.singularity.getFactionFavor(target) +
		ns.singularity.getFactionFavorGain(target);
	if (total_favor < 150) {
		ns.singularity.workForFaction(target, "hacking", false);
	}
}

/**
 * Returns the next faction in the faction order that has unowned augmentations, excluding the player's current gang faction.
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {string} The name of the next faction in the faction order that has unowned augmentations.
 */
export function get_next_faction(ns: NS): string {
	var faction_order = [
		"CyberSec",
		"NiteSec",
		"The Black Hand",
		"BitRunners",
		"Daedalus",
	];
	if (
		ns.gang.inGang() &&
		faction_order.includes(ns.gang.getGangInformation().faction)
	) {
		faction_order.splice(
			faction_order.indexOf(ns.gang.getGangInformation().faction),
			1,
		);
	}

	var aug_selection = get_remaining_augmentations(ns);

	for (var f of faction_order) {
		if (
			ns.singularity
				.getAugmentationsFromFaction(f as FactionName)
				.some((a) => aug_selection.includes(a))
		) {
			return f;
		}
	}
	return faction_order[faction_order.length - 1];
}

/**
 * Returns the faction with the highest reputation, excluding the player's current gang faction.
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {string} The name of the faction with the highest reputation.
 */
export function get_highest_faction(ns: NS): string {
	var factions = ns.getPlayer().factions;

	if (ns.gang.inGang()) {
		var index = factions.indexOf(ns.gang.getGangInformation().faction);
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
export function get_remaining_augmentations(ns: NS): string[] {
	var aug: string[] = [];

	for (var f of FACTIONS) {
		for (var a of ns.singularity.getAugmentationsFromFaction(f as FactionName)) {
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
export function get_augmentation_selection(ns: NS, type: string): string[] {
	var aug = get_remaining_augmentations(ns);

	function select_hacking(a: string) {
		var modifiers = ns.singularity.getAugmentationStats(a);
		return (
			modifiers.hacking_chance > 1 ||
			modifiers.hacking_speed > 1 ||
			modifiers.hacking_money > 1 ||
			modifiers.hacking_grow > 1 ||
			modifiers.hacking > 1 ||
			modifiers.hacking_exp > 1
		);
	}

	function select_combat(a: string) {
		var modifiers = ns.singularity.getAugmentationStats(a);
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

	function select_reputation(a: string) {
		return ns.singularity.getAugmentationStats(a).faction_rep > 1;
	}

	var special_aug = ["The Red Pill", "Neuroreceptor Management Implant"];

	if (type == "Hacking") {
		return aug.filter((a) => select_hacking(a));
	} else if (type == "Combat") {
		return aug.filter((a) => select_combat(a));
	} else if (type == "Rep") {
		return aug.filter((a) => select_reputation(a));
	} else if (type == "Special") {
		return special_aug;
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
export function get_unique_augmentations(ns: NS, aug: string[]): string[] {
	return aug.filter((a) => ns.singularity.getAugmentationFactions(a).length == 1);
}

/**
 * Buys augmentations from a specified faction.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} faction - The faction from which to buy augmentations.
 * @param {boolean} continue_buying - Whether to continue buying augmentations if a purchase fails.
 */
export function buy_augmentations(
	ns: NS,
	faction: string = "",
	continue_buying: boolean = false,
) {
	var faction_name = faction;
	if (faction_name == "") {
		faction_name = get_next_faction(ns);
	}

	function get_aug_to_buy(): string[] {
		var aug_selection = get_remaining_augmentations(ns);
		return ns.singularity
			.getAugmentationsFromFaction(faction_name as FactionName)
			.filter((a) => aug_selection.includes(a));
	}

	var aug = get_aug_to_buy().sort(function (a, b) {
		return (
			ns.singularity.getAugmentationPrice(b) -
			ns.singularity.getAugmentationPrice(a)
		);
	});

	var in_gang = ns.gang.inGang();

	while (aug.length > 0) {
		var next_aug = aug[0];
		if (next_aug == "NeuroFlux Governor") {
			aug.shift();
			continue;
		}
		var pre_req = ns.singularity
			.getAugmentationPrereq(next_aug)
			.sort(function (a, b) {
				return (
					ns.singularity.getAugmentationPrice(b) -
					ns.singularity.getAugmentationPrice(a)
				);
			});
		var owned = ns.singularity.getOwnedAugmentations(true);
		for (var a of pre_req.filter((a) => !owned.includes(a))) {
			if (
				!ns.singularity.purchaseAugmentation(faction_name as FactionName, a) &&
				in_gang
			) {
				ns.singularity.purchaseAugmentation(
					ns.gang.getGangInformation().faction,
					a,
				);
			}
		}
		var purchased = ns.singularity.purchaseAugmentation(
			faction_name as FactionName,
			next_aug,
		);
		if (!purchased && in_gang) {
			purchased = ns.singularity.purchaseAugmentation(
				ns.gang.getGangInformation().faction,
				next_aug,
			);
		} // purchasing augment failed -> try again in gang faction
		if (purchased || continue_buying) {
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
export function buy_last(ns: NS) {
	if (ns.gang.inGang()) {
		var gang_faction = ns.gang.getGangInformation().faction;
		buy_augmentations(ns, gang_faction, true);
	}

	var highest_faction = get_highest_faction(ns);
	while (
		ns.getPlayer().money >
			ns.singularity.getAugmentationPrice("NeuroFlux Governor") &&
		ns.singularity.getFactionRep(highest_faction as FactionName) >
			ns.singularity.getAugmentationRepReq("NeuroFlux Governor")
	) {
		ns.singularity.purchaseAugmentation(
			highest_faction as FactionName,
			"NeuroFlux Governor",
		);
	}
}
