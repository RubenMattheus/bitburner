import { NS, GymType } from "@ns";
import { getTimestamp } from "../logging/timestamp";
import { getIncompleteFactions } from "./factions";

export async function main(ns: NS): Promise<void> {
	ns.tprint("Hello Remote API!");
}

export function manageSingularity(ns: NS) {
	pickAction(ns);
	if (ns.singularity.upgradeHomeRam()) {
		ns.print(getTimestamp() + " Upgraded 'home' RAM");
	}
}

function pickAction(ns: NS): boolean {
	if (!checkCombatStats(ns)) {
		return raiseCombatStats(ns);
	} else if (ns.getPlayer().karma > -54000) {
		return commitCrime(ns);
	} else if (factionWork(ns)) {
		return true;
	} else {
		return false;
	}
}

/**
 * Sets the current action to the most fitting crime to lower karma.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function commitCrime(ns: NS) {
	const work = ns.singularity.getCurrentWork();
	const crime = work && work.type == "CRIME" ? work.crimeType : null;

	if (ns.singularity.getCrimeChance("Homicide") > 0.5 && crime != "Homicide") {
		ns.singularity.commitCrime("Homicide", false);
		return true;
	} else if (ns.singularity.getCrimeChance("Homicide") < 0.5 && crime != "Mug") {
		ns.singularity.commitCrime("Mug", false);
		return true;
	} else {
		return false;
	}
}

function checkCombatStats(ns: NS) {
	const skills = ns.getPlayer().skills;

	return (
		skills.strength >= 100 &&
		skills.defense >= 100 &&
		skills.dexterity >= 100 &&
		skills.agility >= 100
	);
}

function raiseCombatStats(ns: NS): boolean {
	const skills = ns.getPlayer().skills;

	const skillsArray: [GymType, number][] = [
		["str", skills.strength],
		["def", skills.defense],
		["dex", skills.dexterity],
		["agi", skills.agility],
	];
	skillsArray.sort((a, b) => a[1] - b[1]);

	if (ns.getPlayer().city != "Sector-12") {
		ns.singularity.travelToCity("Sector-12");
	}
	return ns.singularity.gymWorkout("Powerhouse Gym", skillsArray[0][0], false);
}

export function factionWork(ns: NS): boolean {
	const nextFaction = getIncompleteFactions(ns)[0];

	if (!nextFaction) {
		return false;
	}

	if (ns.singularity.workForFaction(nextFaction, "security", false)) {
		return true;
	} else if (ns.singularity.workForFaction(nextFaction, "field", false)) {
		return true;
	} else if (ns.singularity.workForFaction(nextFaction, "hacking", false)) {
		return true;
	} else {
		return false;
	}
}
