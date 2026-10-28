import { NS } from "@ns";
import { get_timestamp, get_target_time } from "../logging/timestamp";

/**
 * Prints the average chance to win clashes if the player is in a gang.
 *
 * Prints the current karma and estimated time to finish lowering karma if not in a gang.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	if (ns.gang.inGang()) {
		var gangs = Object.keys(ns.gang.getAllGangInformation());
		gangs.splice(0, 1);

		var avg_win = 0;
		for (var gang of gangs) {
			avg_win += ns.gang.getChanceToWinClash(gang);
		}

		ns.tprint(
			"Average chance to win clashes: " + (avg_win / gangs.length).toFixed(2),
		);
	} else {
		var karma = ns.getPlayer().karma;
		ns.tprint("Current karma: " + karma.toFixed(2));
		var karma_needed = -54000 - karma;
		ns.tprint(
			"Lowering karma finishes at " +
				get_target_time(-karma_needed * 1000) +
				" if committing homicide",
		);
	}
}

/**
 * Sets the current action to the most fitting crime to lower karma.
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function commit_crime(ns: NS) {
	var work = ns.singularity.getCurrentWork();
	var crime = work && work.type == "CRIME" ? work.crimeType : null;

	if (ns.singularity.getCrimeChance("Homicide") > 0.5 && crime != "Homicide") {
		ns.singularity.commitCrime("Homicide", false);
	} else if (ns.singularity.getCrimeChance("Homicide") < 0.5 && crime != "Mug") {
		ns.singularity.commitCrime("Mug", false);
	}
}

/**
 * Orchestrator function for gang API functions.
 *
 * Recruits members and sets actions if the player is currently in a gang.
 *
 * Creates a gang with NiteSec if the player is not in a gang and the type is "Hacking".
 *
 * Creates a gang with Slum Snakes if the player is not in a gang and the type is "Combat".
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} type - The type of gang to create if the player is not in a gang ("Hacking" or "Combat").
 */
export function manage_gang(ns: NS, type: string) {
	if (ns.gang.inGang()) {
		recruit_members(ns);

		if (ns.gang.getGangInformation().isHacking) {
			set_actions(ns, "Hacking");
		} else {
			set_actions(ns, "Combat");
		}
	} else if (type == "Hacking" && ns.getPlayer().factions.includes("NiteSec")) {
		ns.gang.createGang("NiteSec");
	} else if (type == "Combat" && ns.getPlayer().factions.includes("Slum Snakes")) {
		ns.gang.createGang("Slum Snakes");
	}
}

/**
 * Renames gang members to "memberX" where X is the member's index + 1.
 *
 * Recruits new members with names "memberX" where X is the next available index.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function recruit_members(ns: NS) {
	const TIMESTAMP = get_timestamp();
	for (var i in ns.gang.getMemberNames()) {
		var member = ns.gang.getMemberNames()[i];
		var new_name = "member" + String(Number(i) + 1);
		if (member != new_name) {
			ns.gang.renameMember(member, new_name);
		}
	}

	while (ns.gang.canRecruitMember()) {
		var name = "member" + String(ns.gang.getMemberNames().length + 1);
		ns.gang.recruitMember(name);
		ns.print(TIMESTAMP + " Recruited " + name + " to the gang");
	}
}

/**
 * Sets the actions for gang members based on the gang type.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} type - The type of gang ("Hacking" or "Combat").
 */
function set_actions(ns: NS, type: string) {
	var gang = ns.gang.getGangInformation();
	var members = ns.gang.getMemberNames();

	// Check for ascensions
	for (var member of members) {
		check_ascension(ns, member, type == "Hacking" ? "Hacking" : "Combat");
	}

	// Sort members based on their stats
	if (type == "Hacking") {
		members.sort(function (a, b) {
			return (
				ns.gang.getMemberInformation(a).hack -
				ns.gang.getMemberInformation(b).hack
			);
		});
	} else {
		members.sort(function (a, b) {
			var member_a = ns.gang.getMemberInformation(a);
			var a_combat = member_a.str + member_a.def + member_a.dex + member_a.agi;

			var member_b = ns.gang.getMemberInformation(b);
			var b_combat = member_b.str + member_b.def + member_b.dex + member_b.agi;
			return a_combat / 4 - b_combat / 4;
		});
	}
	members.reverse();

	// Divide members into three groups for task assignment
	var div = Math.floor(members.length / 3);
	var g1 = members.slice(0, div);
	var g2 = members.slice(div, div * 2);
	var g3 = members.slice(div * 2);

	// Purchase equipment for members
	for (var m of members) {
		purchase_equipment(ns, m, type == "Hacking" ? "Hacking" : "Combat");
	}

	var combined_wanted_gain = get_combined_wanted_gain(ns, type, g1);
	var can_win = can_win_clashes(ns);

	// Set territory warfare based on clash win chance
	if (can_win) {
		ns.gang.setTerritoryWarfare(true);
	} else {
		ns.gang.setTerritoryWarfare(false);
	}
	var warfare = gang.territoryClashChance > 0;

	// Check to see if there are no ongoing clashes but there is a need to raise win chance
	if (
		type == "Combat" &&
		ns.gang.getMemberNames().length >= 12 &&
		!can_win &&
		!warfare
	) {
		// Train combat if stats are low, else set action to territory warfare
		for (var m of members) {
			var info = ns.gang.getMemberInformation(m);
			if (
				info.str < info.str_asc_mult * 100 ||
				info.def < info.def_asc_mult * 100 ||
				info.dex < info.dex_asc_mult * 100 ||
				info.agi < info.agi_asc_mult * 100
			) {
				ns.gang.setMemberTask(m, "Train Combat");
			} else {
				ns.gang.setMemberTask(m, "Territory Warfare");
			}
		}
		return;
	}

	// Lower wanted level if it's too high, else raise reputation (if not max members) or raise money (if max members)
	for (var m of g1) {
		if (gang.wantedLevel - 1 > combined_wanted_gain * -1) {
			ns.gang.setMemberTask(
				m,
				type == "Hacking" ? "Ethical Hacking" : "Vigilante Justice",
			);
		} else if (ns.gang.getMemberNames().length < 12) {
			ns.gang.setMemberTask(
				m,
				type == "Hacking" ? "Cyberterrorism" : "Terrorism",
			);
		} else {
			ns.gang.setMemberTask(
				m,
				type == "Hacking" ? "Money Laundering" : "Human Trafficking",
			);
		}
	}

	// Lower wanted level if it's too high, else raise stats
	for (var m of g2) {
		if (gang.wantedLevel - 1 < combined_wanted_gain * -1) {
			ns.gang.setMemberTask(
				m,
				type == "Hacking" ? "Cyberterrorism" : "Terrorism",
			);
		} else {
			ns.gang.setMemberTask(
				m,
				type == "Hacking" ? "Train Hacking" : "Train Combat",
			);
		}
	}

	// Raise stats
	for (var m of g3) {
		ns.gang.setMemberTask(m, type == "Hacking" ? "Train Hacking" : "Train Combat");
	}

	// Raise stats if recently ascended
	for (var m of members) {
		var info = ns.gang.getMemberInformation(m);
		if (type == "Hacking" && info.hack < info.hack_asc_mult * 100) {
			ns.gang.setMemberTask(m, "Train Hacking");
		} else if (
			info.str < info.str_asc_mult * 100 ||
			info.def < info.def_asc_mult * 100 ||
			info.dex < info.dex_asc_mult * 100 ||
			info.agi < info.agi_asc_mult * 100
		) {
			ns.gang.setMemberTask(m, "Train Combat");
		}
	}
}

/**
 * Calculates the combined wanted level gain of all members when action is set to lower wanted level.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} type - The type of gang ("Hacking" or "Combat").
 * @param {string[]} members - The names of the gang members.
 * @returns {number} The combined wanted level gain of all members.
 */
function get_combined_wanted_gain(ns: NS, type: string, members: string[]) {
	var combined_wanted_gain = 0;
	for (var member of members) {
		ns.gang.setMemberTask(
			member,
			type == "Hacking" ? "Ethical Hacking" : "Vigilante Justice",
		);
		combined_wanted_gain +=
			ns.gang.getMemberInformation(member).wantedLevelGain * 5 * 11; // cycle is 0.2 sec
	}
	if (ns.gang.getBonusTime() > 10000) {
		combined_wanted_gain = combined_wanted_gain * 25;
	}
	return combined_wanted_gain;
}

/**
 * Checks to see if it is a good moment to start territory warfare
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {boolean} True if the clash win chance is above 0.66 for all gangs, false otherwise.
 */
function can_win_clashes(ns: NS): boolean {
	var gangs = Object.keys(ns.gang.getAllGangInformation());
	gangs.splice(0, 1);

	for (var g of gangs) {
		if (ns.gang.getChanceToWinClash(g) < 0.66) {
			return false;
		}
	}
	return true;
}

/**
 * Checks if any of the member's useful stat multipliers would double after ascending, and ascends the member if so.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} member - The name of the gang member to check for ascension.
 * @param {string} type - The type of gang ("Hacking" or "Combat").
 */
function check_ascension(ns: NS, member: string, type: string) {
	var result = ns.gang.getAscensionResult(member);

	if (result == undefined) {
		return;
	}

	var next = 2;
	if (type == "Hacking") {
		while (next < ns.gang.getMemberInformation(member).hack_asc_mult) {
			next *= 2;
		}
	}

	var needed_result = next / ns.gang.getMemberInformation(member).hack_asc_mult;

	if (type == "Hacking" && result.hack >= needed_result) {
		ns.gang.ascendMember(member);
		ns.print(get_timestamp() + " Ascended " + member);
	} else if (
		result.str >= 2 ||
		result.def >= 2 ||
		result.dex >= 2 ||
		result.agi >= 2
	) {
		ns.gang.ascendMember(member);
		ns.print(get_timestamp() + " Ascended " + member);
	}
}

/**
 * Purchases equipment for a gang member based on the gang type.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} member - The name of the gang member to purchase equipment for.
 * @param {string} type - The type of gang ("Hacking" or "Combat") to determine which equipment to purchase.
 */
function purchase_equipment(ns: NS, member: string, type: string) {
	var equipment_list = ns.gang.getEquipmentNames();

	for (var equipment of equipment_list) {
		if (ns.gang.getEquipmentCost(equipment) > ns.getPlayer().money * 0.5) {
			continue;
		}

		var stats = ns.gang.getEquipmentStats(equipment);
		if (type == "Hacking" && "hack" in stats) {
			ns.gang.purchaseEquipment(member, equipment);
		} else if (
			type == "Combat" &&
			("str" in stats || "def" in stats || "dex" in stats || "agi" in stats)
		) {
			ns.gang.purchaseEquipment(member, equipment);
		}
	}
}
