import {
	NS,
	CityName,
	BladeburnerActionType,
	BladeburnerActionName,
	BladeburnerSkillName,
} from "@ns";

const CITIES = ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven"];

/**
 * Prints Bladeburner progress and city information to the terminal.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	const todo = ns.bladeburner.getBlackOpNames();
	const totalCount = todo.length;

	const rank = ns.bladeburner.getRank();
	const finalRank = ns.bladeburner.getBlackOpRank(todo[todo.length - 1]);

	const completed = [];
	const next = ns.bladeburner.getNextBlackOp();
	while (todo[0] != next?.name && todo.length > 0) {
		completed.push(todo.shift());
	}

	ns.tprint("\n--- DONE ---\n" + completed);
	ns.tprint("\n--- TODO ---\n" + todo);
	ns.tprint("\n--- OVERVIEW ---");
	ns.tprint(
		"Black Operations: " +
			completed.length +
			"/" +
			totalCount +
			"\nRank: " +
			rank.toFixed() +
			"/" +
			finalRank +
			" [" +
			((rank / finalRank) * 100).toFixed(2) +
			"%]",
	);
	for (let c of CITIES) {
		ns.tprint(
			"\n--- " +
				c +
				"---\nPOPULATION: " +
				(
					ns.bladeburner.getCityEstimatedPopulation(c as CityName) / 1e9
				).toFixed(3) +
				"b\nCHAOS: " +
				ns.bladeburner.getCityChaos(c as CityName).toFixed(3),
		);
	}
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

/**
 * Sets current action to the most appropriate action based on current Bladeburner stats and city chaos.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function pickAction(ns: NS) {
	const [currentStamina, maxStamina] = ns.bladeburner.getStamina();

	if (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 50) {
		lowerChaos(ns);
		return;
	}

	const dataAccuracyActions = [
		["Tracking", "Contracts"],
		["Investigation", "Operations"],
		["Undercover Operation", "Operations"],
	];

	const retirementActions = [
		["Bounty Hunter", "Contracts"],
		["Retirement", "Contracts"],
		["Assassination", "Operations"],
	];

	if (currentStamina < maxStamina / 2) {
		ns.bladeburner.startAction("General", "Training");
		return;
	} else if (startBlackOp(ns) == true) {
		return;
	} else if (
		(ns.bladeburner.getCityEstimatedPopulation(ns.bladeburner.getCity()) < 1.25e9 ||
			accuracyNeeded(ns)) &&
		performAction(ns, dataAccuracyActions) == true
	) {
	} else if (
		ns.bladeburner.getCityEstimatedPopulation(ns.bladeburner.getCity()) > 1.25e9 &&
		performAction(ns, retirementActions) == true
	) {
		return;
	} else {
		generateWork(ns);
		return;
	}
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
function performAction(ns: NS, actions: string[][]): boolean {
	const currentAction = ns.bladeburner.getCurrentAction()?.name;

	const action = actions
		.filter(
			(a) =>
				ns.bladeburner.getActionCountRemaining(
					a[1] as BladeburnerActionType,
					a[0] as BladeburnerActionName,
				) > 100 &&
				ns.bladeburner.getActionEstimatedSuccessChance(
					a[1] as BladeburnerActionType,
					a[0] as BladeburnerActionName,
				)[0] > 0.5,
		)
		.reverse()[0];

	if (action == undefined) {
		return false;
	}

	if (currentAction != action[0]) {
		return ns.bladeburner.startAction(
			action[1] as BladeburnerActionType,
			action[0] as BladeburnerActionName,
		);
	} else {
		return true;
	}
}

/**
 * Attempts to start a black ops based on current contract counts and estimated success chance. If a suitable black ops is found, it will be started.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function startBlackOp(ns: NS) {
	const currentAction = ns.bladeburner.getCurrentAction()?.name;
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

	if (currentAction == blackOp.name) {
		return true;
	}
	if (playerRank >= targetRank && succes >= 0.66) {
		ns.bladeburner.startAction("Black Operations", blackOp.name);
		return true;
	}
	return false;
}

/**
 * Lowers chaos in the current city by starting the "Stealth Retirement Operation" if conditions are met, or defaults to "Diplomacy" if not.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function lowerChaos(ns: NS) {
	const currentAction = ns.bladeburner.getCurrentAction()?.name;

	const currentPopulation = ns.bladeburner.getCityEstimatedPopulation(
		ns.bladeburner.getCity(),
	);

	const chance = ns.bladeburner.getActionEstimatedSuccessChance(
		"Operations",
		"Stealth Retirement Operation",
	);
	const succes = (chance[0] + chance[1]) / 2;
	if (
		succes >= 0.66 &&
		currentPopulation >= 1e9 &&
		currentAction != "Stealth Retirement Operation" &&
		ns.bladeburner.getActionCountRemaining(
			"Operations",
			"Stealth Retirement Operation",
		) >= 100
	) {
		ns.bladeburner.startAction("Operations", "Stealth Retirement Operation");
	} else if (currentAction != "Diplomacy") {
		ns.bladeburner.startAction("General", "Diplomacy");
	}
}

/**
 * Sets current action to "Incite Violence" if it is not already the current action.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function generateWork(ns: NS) {
	if (ns.bladeburner.getCurrentAction()?.name != "Incite Violence") {
		ns.bladeburner.startAction("General", "Incite Violence");
	}
}

/**
 * Upgrades skills
 *
 * @param {NS} ns - The Bitburner API object.
 */
function upgradeSkills(ns: NS) {
	// const tier0 = ["Overclock"];
	const tier1 = [
		"Blade's Intuition",
		"Cloak",
		"Short-Circuit",
		"Digital Observer",
		"Reaper",
		"Evasive System",
		"Hyperdrive",
	].sort((a, b) => {
		return (
			ns.bladeburner.getSkillLevel(a as BladeburnerSkillName) -
			ns.bladeburner.getSkillLevel(b as BladeburnerSkillName)
		);
	});
	const tier2 = ["Datamancer", "Cyber's Edge"].sort((a, b) => {
		return (
			ns.bladeburner.getSkillLevel(a as BladeburnerSkillName) -
			ns.bladeburner.getSkillLevel(b as BladeburnerSkillName)
		);
	});
	const tier3 = ["Tracer"];
	// const tier4 = ["Hands of Midas"];

	const overclockLevel = ns.bladeburner.getSkillLevel("Overclock");
	// Tier 1: Level has to be lower than one third of skill "Overclock"
	const tier1Filtered = tier1.filter(
		(s) =>
			ns.bladeburner.getSkillLevel(s as BladeburnerSkillName) <
			overclockLevel / 3,
	);
	// Tier 2: Level has to be lower than one fifth of skill "Overclock" and is capped at level 10
	const tier2Filtered = tier2.filter(
		(s) =>
			ns.bladeburner.getSkillLevel(s as BladeburnerSkillName) <
				overclockLevel / 5 &&
			ns.bladeburner.getSkillLevel(s as BladeburnerSkillName) < 10,
	);
	// Tier 3 (earlygame): Level has to be lower than skill "Overclock" and is capped at level 5
	const tier3Filtered = tier3.filter(
		(s) =>
			ns.bladeburner.getSkillLevel(s as BladeburnerSkillName) < overclockLevel &&
			ns.bladeburner.getSkillLevel(s as BladeburnerSkillName) < 5,
	);

	const skillsToUpgrade = tier1Filtered.concat(tier2Filtered, tier3Filtered);

	if (ns.bladeburner.getSkillLevel("Overclock") < 90) {
		for (let s of skillsToUpgrade) {
			if (!ns.bladeburner.upgradeSkill(s as BladeburnerSkillName)) {
				return;
			}
		}
		ns.bladeburner.upgradeSkill("Overclock");
	} else {
		for (let s of tier1) {
			if (!ns.bladeburner.upgradeSkill(s as BladeburnerSkillName)) {
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
	const cities = CITIES;

	cities.sort((a, b) => {
		return (
			ns.bladeburner.getCityEstimatedPopulation(b as CityName) -
			ns.bladeburner.getCityEstimatedPopulation(a as CityName)
		);
	});
	ns.bladeburner.switchCity(cities[0] as CityName);
}
