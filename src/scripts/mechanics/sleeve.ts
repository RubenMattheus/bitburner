import { GymType, NS, SleeveFactionTask, SleevePerson } from "@ns";
import { getTimestamp } from "../logging/timestamp";
import { formatMoney } from "../logging/money";
import { getIncompleteFactions } from "./factions";

export async function main(ns: NS): Promise<void> {
	let alertString = "SLEEVE OVERVIEW";
	const numSleeves = ns.sleeve.getNumSleeves();

	for (let i = 0; i < numSleeves; i++) {
		const sleeve = ns.sleeve.getSleeve(i);
		const memoryString =
			sleeve.memory < 100
				? " (upgrade cost: " +
					formatMoney(ns.sleeve.getMemoryUpgradeCost(i, 1)) +
					")"
				: "";
		alertString = alertString.concat(
			"\nSleeve " +
				i +
				" - shock: " +
				sleeve.shock.toFixed(3) +
				", sync: " +
				sleeve.sync.toFixed(3) +
				", memory: " +
				sleeve.memory +
				memoryString,
		);
	}

	if (ns.sleeve.getNumSleeves() < 8) {
		alertString = alertString.concat(
			"\nSleeve " + numSleeves + " - " + formatMoney(ns.sleeve.getSleeveCost()),
		);
	}

	ns.alert(alertString);
}

export function manageSleeves(ns: NS) {
	// BN10
	purchaseSleeve(ns);
	upgradeSleeves(ns);

	for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
		purchaseSleeveAugmentations(ns, i);
		setSleeveAction(ns, i);
	}
}

function setSleeveAction(ns: NS, index: number): boolean {
	if (prepSleeve(ns, index)) {
		return true;
	} else if (!checkStats(ns, index) && trainStats(ns, index)) {
		return true;
	} else if (
		ns.getPlayer().karma > -54000 &&
		ns.sleeve.setToCommitCrime(index, "Homicide")
	) {
		return true;
	} else if (sleeveFactionWork(ns, index)) {
		return true;
	} else if (sleeveLowerChaos(ns, index)) {
		return true;
	} else if (sleeveGenerateWork(ns, index)) {
		return true;
	} else {
		return trainStats(ns, index);
	}
}

function prepSleeve(ns: NS, index: number) {
	const sleeve = ns.sleeve.getSleeve(index);
	if (sleeve.sync < 100) {
		return ns.sleeve.setToSynchronize(index);
	} else if (sleeve.shock > 0) {
		return ns.sleeve.setToShockRecovery(index);
	} else {
		return false;
	}
}

function purchaseSleeve(ns: NS) {
	const cost = ns.sleeve.getSleeveCost();
	if (ns.getPlayer().money > cost) {
		if (ns.sleeve.purchaseSleeve()?.success == true) {
			ns.print(
				getTimestamp() +
					" Purchased sleeve " +
					(ns.sleeve.getNumSleeves() - 1 + " for " + formatMoney(cost)),
			);
		}
	}
}

function upgradeSleeves(ns: NS) {
	for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
		const cost = ns.sleeve.getMemoryUpgradeCost(i, 1);
		if (ns.getPlayer().money > cost) {
			if (ns.sleeve.upgradeMemory(i, 1)?.success == true) {
				ns.print(
					getTimestamp() +
						" Upgraded memory of sleeve " +
						i +
						" for " +
						formatMoney(cost),
				);
			}
		}
	}
}

function checkStats(ns: NS, index: number): boolean {
	const sleeve = ns.sleeve.getSleeve(index);

	const skills = sleeve.skills;
	const mults = sleeve.mults;

	return (
		skills.hacking > 50 * mults.hacking &&
		skills.strength > 50 * mults.strength &&
		skills.defense > 50 * mults.defense &&
		skills.dexterity > 50 * mults.dexterity &&
		skills.agility > 50 * mults.agility
	);
}

function trainStats(ns: NS, index: number): boolean {
	const skills = ns.sleeve.getSleeve(index).skills;
	const mults = ns.sleeve.getSleeve(index).mults;

	const skillsArray: [string, number][] = [
		["hack", skills.hacking / mults.hacking],
		["str", skills.strength / mults.strength],
		["def", skills.defense / mults.defense],
		["dex", skills.dexterity / mults.dexterity],
		["agi", skills.agility / mults.agility],
	];
	skillsArray.sort((a, b) => a[1] - b[1]);

	if (skillsArray[0][0] == "hack") {
		if (ns.sleeve.getSleeve(index).city != "Volhaven") {
			ns.sleeve.travel(index, "Volhaven");
		}
		return ns.sleeve.setToUniversityCourse(
			index,
			"ZB Institute of Technology",
			"Algorithms",
		);
	} else {
		if (ns.sleeve.getSleeve(index).city != "Sector-12") {
			ns.sleeve.travel(index, "Sector-12");
		}
		return ns.sleeve.setToGymWorkout(
			index,
			"Powerhouse Gym",
			skillsArray[0][0] as GymType,
		);
	}
}

function purchaseSleeveAugmentations(ns: NS, index: number) {
	const availableAugmentations = ns.sleeve
		.getSleevePurchasableAugs(index)
		.filter(
			(a) => ns.sleeve.getSleeveAugmentationPrice(a.name) < ns.getPlayer().money,
		);
	for (let a of availableAugmentations) {
		if (ns.sleeve.purchaseSleeveAug(index, a.name)) {
			ns.print(
				getTimestamp() +
					" Purchased augmentation " +
					a.name +
					" for sleeve " +
					index +
					" for " +
					formatMoney(a.cost),
			);
		}
	}
}

function sleeveFactionWork(ns: NS, index: number): boolean {
	const factions = getIncompleteFactions(ns);
	if (factions.length == 0) {
		return false;
	}

	for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
		const task = ns.sleeve.getTask(i);
		if (task?.type == "FACTION" && task?.factionName == factions[0]) {
			factions.shift();
			if (factions.length == 0) {
				return false;
			}
		}
	}

	if (ns.sleeve.setToFactionWork(index, factions[0], "security")) {
		return true;
	} else if (ns.sleeve.setToFactionWork(index, factions[0], "field")) {
		return true;
	} else if (ns.sleeve.setToFactionWork(index, factions[0], "hacking")) {
		return true;
	} else {
		return false;
	}
}

function sleeveGenerateWork(ns: NS, index: number): boolean {
	if (ns.sleeve.getTask(index)?.type == "INFILTRATE") {
		return true;
	}

	for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
		const task = ns.sleeve.getTask(i);
		if (task?.type == "INFILTRATE") {
			return false;
		}
	}

	return ns.sleeve.setToBladeburnerAction(index, "Infiltrate Synthoids");
}

function sleeveLowerChaos(ns: NS, index: number): boolean {
	if (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) < 100) {
		return false;
	}

	if (ns.sleeve.getTask(index)?.type == "BLADEBURNER") {
		return true;
	} else {
		return ns.sleeve.setToBladeburnerAction(index, "Diplomacy");
	}
}
