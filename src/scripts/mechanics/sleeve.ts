import { GymType, NS, SleeveFactionTask, SleevePerson } from "@ns";
import { getTimestamp } from "../logging/timestamp";
import { formatMoney } from "../logging/money";
import { getNextFaction } from "./factions";

export async function main(ns: NS): Promise<void> {
	// const sleeves = [...Array(ns.sleeve.getNumSleeves()).keys()].map((i) =>
	// 	ns.sleeve.getSleeve(i),
	// );

	// for (let s of sleeves) {
	// 	ns.tprint(s);
	// }

	const numSleeves = ns.sleeve.getNumSleeves();

	for (let i = 0; i < numSleeves; i++) {
		const sleeve = ns.sleeve.getSleeve(i);
		ns.tprint(
			"Sleeve " +
				i +
				" -- shock: " +
				sleeve.shock.toFixed(3) +
				", sync: " +
				sleeve.sync.toFixed(3) +
				", memory upgrade cost: " +
				formatMoney(ns.sleeve.getMemoryUpgradeCost(i, 1)),
		);
	}

	if (ns.sleeve.getNumSleeves() < 8) {
		ns.tprint(
			"Sleeve " + numSleeves + " cost: " + formatMoney(ns.sleeve.getSleeveCost()),
		);
	}
}

export function manageSleeves(ns: NS) {
	// BN10
	purchaseSleeve(ns);
	upgradeSleeves(ns);

	for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
		purchaseSleeveAugmentations(ns, i);
		const sleeve = ns.sleeve.getSleeve(i);
		if (sleeve.sync < 100 || sleeve.shock > 0) {
			prepSleeve(ns, i);
		} else if (!checkStats(sleeve)) {
			trainStats(ns, i);
		} else if (ns.getPlayer().karma > -54000) {
			ns.sleeve.setToCommitCrime(i, "Homicide");
		} else if (sleeveFactionWork(ns, i)) {
			continue;
		}
	}
}

function prepSleeve(ns: NS, index: number) {
	const sleeve = ns.sleeve.getSleeve(index);
	if (sleeve.sync < 100) {
		ns.sleeve.setToSynchronize(index);
	} else if (sleeve.shock > 0) {
		ns.sleeve.setToShockRecovery(index);
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

function checkStats(sleeve: SleevePerson) {
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

function trainStats(ns: NS, index: number) {
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
		ns.sleeve.travel(index, "Volhaven");
		ns.sleeve.setToUniversityCourse(
			index,
			"ZB Institute of Technology",
			"Algorithms",
		);
	} else {
		ns.sleeve.travel(index, "Sector-12");
		ns.sleeve.setToGymWorkout(
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
	const faction = getNextFaction(ns);

	for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
		const task = ns.sleeve.getTask(i);
		if (task?.type == "FACTION" && task?.factionName == faction) {
			return false;
		}
	}

	if (ns.sleeve.setToFactionWork(index, faction, "security")) {
		return true;
	} else if (ns.sleeve.setToFactionWork(index, faction, "field")) {
		return true;
	} else if (ns.sleeve.setToFactionWork(index, faction, "hacking")) {
		return true;
	} else {
		return false;
	}
}
