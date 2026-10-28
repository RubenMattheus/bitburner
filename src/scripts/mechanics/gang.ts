import { NS } from "@ns";
import { get_timestamp, get_target_time } from "../logging/timestamp";

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

export function commit_crime(ns: NS) {
	var work = ns.singularity.getCurrentWork();
	var crime = work && work.type == "CRIME" ? work.crimeType : null;

	if (ns.singularity.getCrimeChance("Homicide") > 0.5 && crime != "Homicide") {
		ns.singularity.commitCrime("Homicide", false);
	} else if (crime != "Mug") {
		ns.singularity.commitCrime("Mug", false);
	}
}

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

export function recruit_members(ns: NS) {
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

export function set_actions(ns: NS, type: string) {
	const TIMESTAMP = get_timestamp();

	var gang = ns.gang.getGangInformation();
	var members = ns.gang.getMemberNames();

	for (var member of members) {
		check_ascension(ns, member, type == "Hacking" ? "Hacking" : "Combat");
	}

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

	var div = Math.floor(members.length / 3);
	var g1 = members.slice(0, div);
	var g2 = members.slice(div, div * 2);
	var g3 = members.slice(div * 2);

	for (var m of members) {
		purchase_equipment(ns, m, type == "Hacking" ? "Hacking" : "Combat");
	}

	var combined_wanted_gain = get_combined_wanted_gain(ns, type, g1);
	var can_win = can_win_clashes(ns);

	if (can_win) {
		ns.gang.setTerritoryWarfare(true);
	} else {
		ns.gang.setTerritoryWarfare(false);
	}
	var warfare = gang.territoryClashChance > 0;

	if (
		type == "Combat" &&
		ns.gang.getMemberNames().length >= 12 &&
		!can_win &&
		!warfare
	) {
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

	for (var m of g3) {
		ns.gang.setMemberTask(m, type == "Hacking" ? "Train Hacking" : "Train Combat");
	}

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

export function get_combined_wanted_gain(ns: NS, type: string, members: string[]) {
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

export function can_win_clashes(ns: NS) {
	var gangs = Object.keys(ns.gang.getAllGangInformation());
	gangs.splice(0, 1);

	for (var g of gangs) {
		if (ns.gang.getChanceToWinClash(g) < 0.66) {
			return false;
		}
	}
	return true;
}

export function check_ascension(ns: NS, member: string, goal: string) {
	var result = ns.gang.getAscensionResult(member);

	if (result == undefined) {
		return;
	}

	var next = 2;
	if (goal == "Hacking") {
		while (next < ns.gang.getMemberInformation(member).hack_asc_mult) {
			next *= 2;
		}
	}

	var needed_result = next / ns.gang.getMemberInformation(member).hack_asc_mult;

	if (goal == "Hacking" && result.hack >= needed_result) {
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

export function purchase_equipment(ns: NS, member: string, target: string) {
	var equipment_list = ns.gang.getEquipmentNames();

	for (var equipment of equipment_list) {
		if (ns.gang.getEquipmentCost(equipment) > ns.getPlayer().money * 0.5) {
			continue;
		}

		var stats = ns.gang.getEquipmentStats(equipment);
		if (target == "Hacking" && "hack" in stats) {
			ns.gang.purchaseEquipment(member, equipment);
		} else if (
			target == "Combat" &&
			("str" in stats || "def" in stats || "dex" in stats || "agi" in stats)
		) {
			ns.gang.purchaseEquipment(member, equipment);
		}
	}
}
