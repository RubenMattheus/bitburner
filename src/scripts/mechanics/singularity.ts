import { NS, GymType, CompanyName, JobField, CrimeType } from "@ns";
import { getTimestamp } from "../logging/timestamp";
import { getIncompleteFactions } from "./factions";

export async function main(ns: NS): Promise<void> {
	ns.tprint("Hello Remote API!");
}

export function manageSingularity(ns: NS) {
	pickAction(ns);
	if (ns.singularity.upgradeHomeRam()) {
		ns.print(
			`${getTimestamp()} Upgraded 'home' RAM to ${ns.format.ram(ns.getServerMaxRam("home"))}`,
		);
	}
}

export function manageSingularityLite(ns: NS) {
	commitCrime(ns);
	if (ns.singularity.upgradeHomeRam()) {
		ns.print(
			`${getTimestamp()} Upgraded 'home' RAM to ${ns.format.ram(ns.getServerMaxRam("home"))}`,
		);
	}
}

function pickAction(ns: NS): boolean {
	if (ns.getPlayer().money < 10e6) {
		return commitCrime(ns);
	}
	if (!checkCombatStats(ns)) {
		return raiseCombatStats(ns);
	} else if (ns.getPlayer().karma > -54000) {
		return commitCrime(ns);
	} else if (factionWork(ns)) {
		return true;
	} else {
		return ns.singularity.stopAction();
	}
}

/**
 * Sets the current action to the most fitting crime to lower karma.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function commitCrime(ns: NS) {
	function moneyPerSecond(crimeName: CrimeType) {
		const stats = ns.singularity.getCrimeStats(crimeName);
		const chance = ns.singularity.getCrimeChance(crimeName);
		return (stats.money * chance) / stats.time;
	}

	let crimes = Object.values(ns.enums.CrimeType);
	crimes = crimes.filter((c) => ns.singularity.getCrimeStats(c).time < 60000);
	crimes.sort((a, b) => moneyPerSecond(b) - moneyPerSecond(a));

	let crimeType: CrimeType = "Homicide";
	if (ns.getPlayer().money < 10e6) {
		crimeType = crimes[0];
	}

	const work = ns.singularity.getCurrentWork();
	if (work?.type == "CRIME" && work?.crimeType == crimeType) {
		return true;
	} else {
		ns.singularity.commitCrime(crimeType, false);
		return true;
	}
}

function workJob(ns: NS): boolean {
	const currentAction = ns.singularity.getCurrentWork();
	const job: [CompanyName, JobField] = ["FoodNStuff", "Part-time Employee"];

	if (
		currentAction?.type != "COMPANY" ||
		currentAction.companyName != job[0]
	) {
		ns.singularity.applyToCompany(job[0], job[1]);
		return ns.singularity.workForCompany(job[0], false);
	} else {
		return true;
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
	return ns.singularity.gymWorkout(
		"Powerhouse Gym",
		skillsArray[0][0],
		false,
	);
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
