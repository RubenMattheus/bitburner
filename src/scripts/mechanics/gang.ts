import { NS } from "@ns";
import { getTimestamp, getTargetTime } from "../logging/timestamp";

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
		const gangs = Object.keys(ns.gang.getAllGangInformation());
		gangs.splice(0, 1);

		let avgWin = 0;
		for (let gang of gangs) {
			avgWin += ns.gang.getChanceToWinClash(gang);
		}

		ns.tprint(
			"Average chance to win clashes: " + (avgWin / gangs.length).toFixed(2),
		);
	} else {
		const karma = ns.getPlayer().karma;
		ns.tprint("Current karma: " + karma.toFixed(2));
		const karmaNeeded = -54000 - karma;
		ns.tprint(
			"Lowering karma finishes at " +
				getTargetTime(-karmaNeeded * 1000) +
				" if committing homicide",
		);
	}
}

/**
 * Sets the current action to the most fitting crime to lower karma.
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function commitCrime(ns: NS) {
	const work = ns.singularity.getCurrentWork();
	const crime = work && work.type == "CRIME" ? work.crimeType : null;

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
export function manageGang(ns: NS, type: string) {
	if (ns.gang.inGang()) {
		recruitMembers(ns);

		if (ns.gang.getGangInformation().isHacking) {
			setActions(ns, "Hacking");
		} else {
			setActions(ns, "Combat");
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
function recruitMembers(ns: NS) {
	const TIMESTAMP = getTimestamp();
	for (let i in ns.gang.getMemberNames()) {
		const member = ns.gang.getMemberNames()[i];
		const newName = "member" + String(Number(i) + 1);
		if (member != newName) {
			ns.gang.renameMember(member, newName);
		}
	}

	while (ns.gang.canRecruitMember()) {
		const name = "member" + String(ns.gang.getMemberNames().length + 1);
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
function setActions(ns: NS, type: string) {
	const gang = ns.gang.getGangInformation();
	const members = ns.gang.getMemberNames();

	// Check for ascensions
	for (let member of members) {
		checkAscension(ns, member, type == "Hacking" ? "Hacking" : "Combat");
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
			const memberA = ns.gang.getMemberInformation(a);
			const aCombat = memberA.str + memberA.def + memberA.dex + memberA.agi;

			const memberB = ns.gang.getMemberInformation(b);
			const bCombat = memberB.str + memberB.def + memberB.dex + memberB.agi;
			return aCombat / 4 - bCombat / 4;
		});
	}
	members.reverse();

	// Divide members into three groups for task assignment
	const div = Math.floor(members.length / 3);
	const g1 = members.slice(0, div);
	const g2 = members.slice(div, div * 2);
	const g3 = members.slice(div * 2);

	// Purchase equipment for members
	for (let m of members) {
		purchaseEquipment(ns, m, type == "Hacking" ? "Hacking" : "Combat");
	}

	const combinedWantedGain = getCombinedWantedGain(ns, type, g1);
	const canWin = canWinClashes(ns);

	// Set territory warfare based on clash win chance
	if (canWin) {
		ns.gang.setTerritoryWarfare(true);
	} else {
		ns.gang.setTerritoryWarfare(false);
	}
	const warfare = gang.territoryClashChance > 0;

	// Check to see if there are no ongoing clashes but there is a need to raise win chance
	if (
		type == "Combat" &&
		ns.gang.getMemberNames().length >= 12 &&
		!canWin &&
		!warfare
	) {
		for (let m of members) {
			ns.gang.setMemberTask(m, "Territory Warfare");
		}
	} else {
		// Lower wanted level if it's too high, else raise reputation (if not max members) or raise money (if max members)
		for (let m of g1) {
			if (gang.wantedLevel - 1 > combinedWantedGain * -1) {
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
		for (let m of g2) {
			if (gang.wantedLevel - 1 < combinedWantedGain * -1) {
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
		for (let m of g3) {
			ns.gang.setMemberTask(
				m,
				type == "Hacking" ? "Train Hacking" : "Train Combat",
			);
		}
	}

	// Raise stats if recently ascended
	for (let m of members) {
		const info = ns.gang.getMemberInformation(m);
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
function getCombinedWantedGain(ns: NS, type: string, members: string[]): number {
	let combinedWantedGain = 0;
	for (let member of members) {
		ns.gang.setMemberTask(
			member,
			type == "Hacking" ? "Ethical Hacking" : "Vigilante Justice",
		);
		combinedWantedGain +=
			ns.gang.getMemberInformation(member).wantedLevelGain * 5 * 11; // cycle is 0.2 sec
	}
	if (ns.gang.getBonusTime() > 10000) {
		combinedWantedGain = combinedWantedGain * 25;
	}
	return combinedWantedGain;
}

/**
 * Checks to see if it is a good moment to start territory warfare
 *
 * @param {NS} ns - The Bitburner API object.
 * @returns {boolean} True if the clash win chance is above 0.66 for all gangs, false otherwise.
 */
function canWinClashes(ns: NS): boolean {
	const gangs = Object.keys(ns.gang.getAllGangInformation());
	gangs.splice(0, 1);

	return gangs.every((g) => ns.gang.getChanceToWinClash(g) > 0.66);
}

/**
 * Checks if any of the member's useful stat multipliers would double after ascending, and ascends the member if so.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} member - The name of the gang member to check for ascension.
 * @param {string} type - The type of gang ("Hacking" or "Combat").
 */
function checkAscension(ns: NS, member: string, type: string) {
	const result = ns.gang.getAscensionResult(member);

	if (result == undefined) {
		return;
	}

	let next = 2;
	if (type == "Hacking") {
		while (next < ns.gang.getMemberInformation(member).hack_asc_mult) {
			next *= 2;
		}
	}

	const neededResult = next / ns.gang.getMemberInformation(member).hack_asc_mult;

	if (type == "Hacking" && result.hack >= neededResult) {
		ns.gang.ascendMember(member);
		ns.print(getTimestamp() + " Ascended " + member);
	} else if (
		result.str >= 2 ||
		result.def >= 2 ||
		result.dex >= 2 ||
		result.agi >= 2
	) {
		ns.gang.ascendMember(member);
		ns.print(getTimestamp() + " Ascended " + member);
	}
}

/**
 * Purchases equipment for a gang member based on the gang type.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string} member - The name of the gang member to purchase equipment for.
 * @param {string} type - The type of gang ("Hacking" or "Combat") to determine which equipment to purchase.
 */
function purchaseEquipment(ns: NS, member: string, type: string) {
	const equipmentList = ns.gang.getEquipmentNames();

	for (let equipment of equipmentList) {
		if (ns.gang.getEquipmentCost(equipment) > ns.getPlayer().money * 0.5) {
			continue;
		}

		const stats = ns.gang.getEquipmentStats(equipment);
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
