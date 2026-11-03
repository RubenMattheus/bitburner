import {
	NS,
	BladeburnerActionType,
	BladeburnerActionName,
	BladeburnerSkillName,
} from "@ns";
import { getTimestamp } from "../logging/timestamp";

/**
 * Prints Bladeburner progress and city information to the terminal.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	let alertString = "BLADEBURNER OVERVIEW";
	const blackOps = ns.bladeburner.getBlackOpNames();
	const finalRank = ns.bladeburner.getBlackOpRank(blackOps[blackOps.length - 1]);

	const completed = [];
	const next = ns.bladeburner.getNextBlackOp();
	while (blackOps[0] != next?.name && blackOps.length > 0) {
		completed.push(blackOps.shift());
	}

	alertString = alertString.concat(
		"\nBlack Operations: " +
			completed.length +
			"/" +
			(blackOps.length + completed.length) +
			"\nRank: " +
			ns.bladeburner.getRank().toFixed() +
			"/" +
			finalRank +
			" [" +
			((ns.bladeburner.getRank() / finalRank) * 100).toFixed(2) +
			"%]",
	);
	alertString = alertString.concat("\n--- DONE ---\n" + completed);
	alertString = alertString.concat("\n--- TODO ---\n" + blackOps);

	let totalPopulation = 0;
	let totalChaos = 0;
	for (let c of Object.values(ns.enums.CityName)) {
		const cityPopulation = ns.bladeburner.getCityEstimatedPopulation(c);
		const cityChaos = ns.bladeburner.getCityChaos(c);
		alertString = alertString.concat(
			"\n--- " +
				c +
				"---\nPOPULATION: " +
				(cityPopulation / 1e9).toFixed(3) +
				"b\nCHAOS: " +
				cityChaos.toFixed(3),
		);
		totalPopulation += cityPopulation;
		totalChaos += cityChaos;
	}

	alertString = alertString.concat(
		"\n--- COMBINED --- \nPOPULATION: " +
			(totalPopulation / 1e9).toFixed(1) +
			"b/" +
			Object.values(ns.enums.CityName).length * 1.25 +
			"b\nCHAOS: " +
			totalChaos.toFixed(1) +
			"/" +
			Object.values(ns.enums.CityName).length * 50,
	);

	ns.alert(alertString);
}

/**
 * Orchestrator function for Bladeburner API
 *
 * @param {NS} ns - The Bitburner API object.
 */
export function manageBladeburner(ns: NS) {
	ns.bladeburner.joinBladeburnerDivision();
	ns.bladeburner.joinBladeburnerFaction();

	pickCity(ns);
	pickAction(ns);
	upgradeSkills(ns);
}

function setAction(ns: NS, type: BladeburnerActionType, name: BladeburnerActionName) {
	if (ns.bladeburner.getCurrentAction()?.name != name) {
		return ns.bladeburner.startAction(type, name);
	} else {
		return true;
	}
}

/**
 * Sets current action to the most appropriate action based on current Bladeburner stats and city chaos.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function pickAction(ns: NS): boolean {
	const [currentStamina, maxStamina] = ns.bladeburner.getStamina();

	if (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 50 && lowerChaos(ns)) {
		return true;
	} else if (lowerOtherCityChaos(ns)) {
		return true;
	}

	const dataAccuracyActions: [BladeburnerActionType, BladeburnerActionName][] = [
		["Contracts", "Tracking"],
		["Operations", "Investigation"],
		["Operations", "Undercover Operation"],
	];

	const retirementActions: [BladeburnerActionType, BladeburnerActionName][] = [
		["Contracts", "Bounty Hunter"],
		["Contracts", "Retirement"],
		["Operations", "Assassination"],
	];

	if (currentStamina > maxStamina / 2) {
		if (startBlackOp(ns) == true) {
			return true;
		} else if (
			ns.bladeburner.getCityEstimatedPopulation(ns.bladeburner.getCity()) >
				1.25e9 &&
			!accuracyNeeded(ns) &&
			performAction(ns, retirementActions) == true
		) {
			return true;
		} else if (performAction(ns, dataAccuracyActions) == true) {
			return true;
		} else if (generateWork(ns, dataAccuracyActions.concat(retirementActions))) {
			return true;
		} else if (increaseOtherCityAccuracy(ns, dataAccuracyActions)) {
			return true;
		}
	}
	return setAction(ns, "General", "Training");
}

function accuracyNeeded(ns: NS): boolean {
	const nextBlackOp = ns.bladeburner.getNextBlackOp();
	if (nextBlackOp == null) {
		return false;
	}
	const chance = ns.bladeburner.getActionEstimatedSuccessChance(
		"Black Operations",
		nextBlackOp.name,
	);
	if (chance[0] != chance[1]) {
		return true;
	} else {
		return false;
	}
}

/**
 * Sets current action to best action from subset.
 *
 * @param {NS} ns - The Bitburner API object.
 * @param {string[][]} actions - The subset of actions to pick from.
 * @returns {boolean} Whether or not a new action was started or was already in progress.
 */
function performAction(
	ns: NS,
	actions: [BladeburnerActionType, BladeburnerActionName][],
): boolean {
	const action = actions
		.filter(
			(a) =>
				ns.bladeburner.getActionCountRemaining(a[0], a[1]) > 50 &&
				ns.bladeburner.getActionEstimatedSuccessChance(a[0], a[1])[0] > 0.5,
		)
		.reverse()[0];

	if (action == undefined) {
		return false;
	}

	return setAction(ns, action[0], action[1]);
}

/**
 * Attempts to start a black ops based on current contract counts and estimated success chance. If a suitable black ops is found, it will be started.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function startBlackOp(ns: NS) {
	const blackOp = ns.bladeburner.getNextBlackOp();
	if (blackOp == null) {
		return;
	}

	ns.bladeburner.setTeamSize(
		"Black Operations",
		blackOp.name,
		ns.bladeburner.getTeamSize(),
	);

	const targetRank = blackOp.rank;
	const playerRank = ns.bladeburner.getRank();

	const chance = ns.bladeburner.getActionEstimatedSuccessChance(
		"Black Operations",
		blackOp.name,
	);
	const succes = (chance[0] + chance[1]) / 2;

	if (playerRank >= targetRank && succes >= 0.66) {
		return setAction(ns, "Black Operations", blackOp.name);
	} else {
		return false;
	}
}

/**
 * Lowers chaos in the current city by starting the "Stealth Retirement Operation" if conditions are met, or defaults to "Diplomacy" if not.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function lowerChaos(ns: NS): boolean {
	const currentPopulation = ns.bladeburner.getCityEstimatedPopulation(
		ns.bladeburner.getCity(),
	);

	if (
		ns.bladeburner.getActionCountRemaining(
			"Operations",
			"Stealth Retirement Operation",
		) > 50 &&
		ns.bladeburner.getActionEstimatedSuccessChance(
			"Operations",
			"Stealth Retirement Operation",
		)[0] > 0.5 &&
		currentPopulation >= 1e9
	) {
		return setAction(ns, "Operations", "Stealth Retirement Operation");
	} else {
		return setAction(ns, "General", "Diplomacy");
	}
}

/**
 * Upgrades skills
 *
 * @param {NS} ns - The Bitburner API object.
 */
function upgradeSkills(ns: NS) {
	// const tier0: BladeburnerSkillName[] = ["Overclock"];

	const tier1: BladeburnerSkillName[] = [
		"Blade's Intuition",
		"Cloak",
		"Short-Circuit",
		"Digital Observer",
		"Reaper",
		"Evasive System",
		"Hyperdrive",
	];
	tier1.sort((a, b) => {
		return ns.bladeburner.getSkillLevel(a) - ns.bladeburner.getSkillLevel(b);
	});

	const tier2: BladeburnerSkillName[] = ["Datamancer"];
	tier2.sort((a, b) => {
		return ns.bladeburner.getSkillLevel(a) - ns.bladeburner.getSkillLevel(b);
	});

	const tier3: BladeburnerSkillName[] = ["Tracer"];

	// const tier4: BladeburnerSkillName[] = ["Cyber's Edge", "Hands of Midas"];

	const overclockLevel = ns.bladeburner.getSkillLevel("Overclock");
	// Tier 1: Level has to be lower than one third of skill "Overclock"
	const tier1Filtered = tier1.filter(
		(s) => ns.bladeburner.getSkillLevel(s) < overclockLevel / 3,
	);
	// Tier 2: Level has to be lower than one fifth of skill "Overclock" and is capped at level 10
	const tier2Filtered = tier2.filter(
		(s) =>
			ns.bladeburner.getSkillLevel(s) < overclockLevel / 5 &&
			ns.bladeburner.getSkillLevel(s) < 10,
	);
	// Tier 3 (earlygame): Level has to be lower than skill "Overclock" and is capped at level 5
	const tier3Filtered = tier3.filter(
		(s) =>
			ns.bladeburner.getSkillLevel(s) < overclockLevel &&
			ns.bladeburner.getSkillLevel(s) < 5,
	);

	const skillsToUpgrade = tier1Filtered.concat(tier2Filtered, tier3Filtered);

	if (ns.bladeburner.getSkillLevel("Overclock") < 90) {
		for (let s of skillsToUpgrade) {
			if (!ns.bladeburner.upgradeSkill(s)) {
				return;
			}
		}
		if (ns.bladeburner.upgradeSkill("Overclock")) {
			ns.print(
				getTimestamp() + " Upgraded Overclock to level " + (overclockLevel + 1),
			);
		}
	} else {
		for (let s of tier1) {
			if (!ns.bladeburner.upgradeSkill(s)) {
				return;
			}
		}
	}
}

/**
 * Picks the city with the highest estimated population and switches to it.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function pickCity(ns: NS) {
	const cities = Object.values(ns.enums.CityName);

	cities.sort((a, b) => {
		return (
			ns.bladeburner.getCityEstimatedPopulation(b) -
			ns.bladeburner.getCityEstimatedPopulation(a)
		);
	});
	ns.bladeburner.switchCity(cities[0]);
}

function lowerOtherCityChaos(ns: NS): boolean {
	const cities = Object.values(ns.enums.CityName).filter(
		(c) => ns.bladeburner.getCityChaos(c) > 100,
	);
	cities.sort(
		(a, b) => ns.bladeburner.getCityChaos(b) - ns.bladeburner.getCityChaos(a),
	);

	if (cities.length == 0) {
		return false;
	}

	ns.bladeburner.switchCity(cities[0]);
	return lowerChaos(ns);
}

function increaseOtherCityAccuracy(
	ns: NS,
	dataAccuracyActions: [BladeburnerActionType, BladeburnerActionName][],
): boolean {
	for (let c of Object.values(ns.enums.CityName)) {
		ns.bladeburner.switchCity(c);
		if (accuracyNeeded(ns)) {
			if (performAction(ns, dataAccuracyActions)) {
				return true;
			} else {
				return setAction(ns, "General", "Field Analysis");
			}
		}
	}
	return false;
}

function generateWork(
	ns: NS,
	actions: [BladeburnerActionType, BladeburnerActionName][],
): boolean {
	if (
		Object.values(ns.enums.CityName).every(
			(c) =>
				ns.bladeburner.getCityChaos(c) < 40 &&
				actions.some(
					(a) => ns.bladeburner.getActionCountRemaining(a[0], a[1]) < 100,
				),
		)
	) {
		return setAction(ns, "General", "Incite Violence");
	} else {
		return false;
	}
}
