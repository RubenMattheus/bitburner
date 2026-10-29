import { NS, CityName, BladeburnerActionType, BladeburnerActionName } from "@ns";

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
		ns.bladeburner.getCityEstimatedPopulation(ns.bladeburner.getCity()) > 1.25e9
	) {
		if (performAction(ns, retirementActions) == true) {
			return;
		}
	} else if (performAction(ns, dataAccuracyActions) == true) {
		return;
	} else {
		generateWork(ns);
		return;
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
	while (true) {
		let skills = ns.bladeburner.getSkillNames();

		// level cap 0
		skills = skills.filter((skill) => !["Hands of Midas"].includes(skill));

		// level cap 5
		skills = skills.filter(
			(skill) =>
				!["Tracer"].includes(skill) || ns.bladeburner.getSkillLevel(skill) < 5,
		);

		// level cap 10
		skills = skills.filter(
			(skill) =>
				!["Datamancer", "Cyber's Edge"].includes(skill) ||
				ns.bladeburner.getSkillLevel(skill) < 10,
		);

		// no level cap
		skills = skills.filter(
			(skill) =>
				![
					"Blade's Intuition",
					"Cloak",
					"Short-Circuit",
					"Digital Observer",
					"Reaper",
					"Evasive System",
					"Hyperdrive",
				].includes(skill) ||
				ns.bladeburner.getSkillLevel(skill) <
					ns.bladeburner.getSkillLevel("Overclock") / 3 ||
				ns.bladeburner.getSkillLevel("Overclock") == 90,
		);

		if (ns.bladeburner.getSkillLevel("Overclock") == 90) {
			skills = skills.filter((skill) => skill != "Overclock");
		}

		skills.sort((a, b) => {
			return ns.bladeburner.getSkillLevel(a) - ns.bladeburner.getSkillLevel(b);
		});

		if (!ns.bladeburner.upgradeSkill(skills[0])) {
			return;
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
