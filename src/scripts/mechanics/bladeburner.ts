import { NS, CityName } from "@ns";

const CITIES = ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven"];

/**
 * Prints Bladeburner progress and city information to the terminal.
 *
 * @param {NS} ns - The Bitburner API object.
 * @async
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
	var todo = ns.bladeburner.getBlackOpNames();
	var total_count = todo.length;

	var rank = ns.bladeburner.getRank();
	var final_rank = ns.bladeburner.getBlackOpRank(todo[todo.length - 1]);

	var completed = [];
	var next = ns.bladeburner.getNextBlackOp();
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
			total_count +
			"\nRank: " +
			rank.toFixed() +
			"/" +
			final_rank +
			" [" +
			((rank / final_rank) * 100).toFixed(2) +
			"%]",
	);
	for (var c of CITIES) {
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
export function manage_bladeburner(ns: NS) {
	ns.bladeburner.joinBladeburnerDivision();
	ns.bladeburner.joinBladeburnerFaction();

	pick_city(ns);
	pick_action(ns);
	upgrade_skills(ns);
}

/**
 * Sets current action to the most appropriate action based on current Bladeburner stats and city chaos.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function pick_action(ns: NS) {
	var [stamina_current, stamina_max] = ns.bladeburner.getStamina();

	if (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 50) {
		lower_chaos(ns);
		return;
	}

	if (stamina_current < stamina_max / 2) {
		ns.bladeburner.startAction("General", "Training");
		return;
	} else if (start_black_op(ns) == true) {
		return;
	} else if (start_operation(ns) == true) {
		return;
	} else if (start_contract(ns) == true) {
		return;
	} else {
		generate_work(ns);
	}
}

/**
 * Sets current action to "Incite Violence" if it is not already the current action.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function generate_work(ns: NS) {
	if (ns.bladeburner.getCurrentAction()?.name != "Incite Violence") {
		ns.bladeburner.startAction("General", "Incite Violence");
	}
}

/**
 * Attempts to start a contract based on current contract counts and estimated success chance. If a suitable contract is found, it will be started.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function start_contract(ns: NS) {
	var current_action = ns.bladeburner.getCurrentAction()?.name;
	var contracts = ns.bladeburner.getContractNames();

	// Split contracts into two categories: stealth (no retirement) and retirement
	var contracts_stealth = contracts.filter((a) => ["Tracking"].includes(a));
	var contracts_retirement = contracts.filter((a) =>
		["Bounty Hunter", "Retirement"].includes(a),
	);

	// Exclude retirement contracts if population is below 1.25b
	var selection =
		ns.bladeburner.getCityEstimatedPopulation(ns.bladeburner.getCity()) < 1.25e9
			? contracts_stealth
			: contracts_stealth.concat(contracts_retirement);

	// Pick contract that has more than 100 remaining and has a success chance of at least 50%
	for (let c of selection
		.filter((a) => ns.bladeburner.getActionCountRemaining("Contracts", a) >= 100)
		.reverse()) {
		var chance = ns.bladeburner.getActionEstimatedSuccessChance("Contracts", c);
		var succes = (chance[0] + chance[1]) / 2;

		if (current_action == c) {
			return true;
		}
		if (succes >= 0.5) {
			if (ns.bladeburner.startAction("Contracts", c)) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Attempts to start a operation based on current contract counts and estimated success chance. If a suitable operation is found, it will be started.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function start_operation(ns: NS) {
	var current_action = ns.bladeburner.getCurrentAction()?.name;
	var operations = ns.bladeburner.getOperationNames();

	var operations_stealth = operations.filter((a) =>
		["Investigation", "Undercover Operation"].includes(a),
	);
	var operations_retirement = operations.filter((a) =>
		[
			// "Sting Operation",
			// "Raid",
			// "Stealth Retirement Operation",
			"Assassination",
		].includes(a),
	);

	var selection =
		ns.bladeburner.getCityEstimatedPopulation(ns.bladeburner.getCity()) < 1.25e9
			? operations_stealth
			: operations_stealth.concat(operations_retirement);

	for (let o of selection
		.filter((a) => ns.bladeburner.getActionCountRemaining("Operations", a) >= 100)
		.reverse()) {
		ns.bladeburner.setTeamSize("Operations", o, ns.bladeburner.getTeamSize());
		var chance = ns.bladeburner.getActionEstimatedSuccessChance("Operations", o);
		var succes = (chance[0] + chance[1]) / 2;

		if (current_action == o) {
			return true;
		}
		if (succes >= 0.66) {
			if (ns.bladeburner.startAction("Operations", o)) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Attempts to start a black ops based on current contract counts and estimated success chance. If a suitable black ops is found, it will be started.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function start_black_op(ns: NS) {
	var current_action = ns.bladeburner.getCurrentAction()?.name;
	var black_op = ns.bladeburner.getNextBlackOp();
	if (black_op == null) {
		return;
	}

	ns.bladeburner.setTeamSize(
		"Black Operations",
		black_op.name,
		ns.bladeburner.getTeamSize(),
	);

	var target_rank = black_op.rank;
	var player_rank = ns.bladeburner.getRank();

	var chance = ns.bladeburner.getActionEstimatedSuccessChance(
		"Black Operations",
		black_op.name,
	);
	var succes = (chance[0] + chance[1]) / 2;

	if (current_action == black_op.name) {
		return true;
	}
	if (player_rank >= target_rank && succes >= 0.66) {
		ns.bladeburner.startAction("Black Operations", black_op.name);
		return true;
	}
	return false;
}

/**
 * Upgrades skills
 *
 * @param {NS} ns - The Bitburner API object.
 */
function upgrade_skills(ns: NS) {
	while (true) {
		var skills = ns.bladeburner.getSkillNames();

		// level cap 0
		skills = skills.filter((skill) => !["Hands of Midas"].includes(skill));

		// level cap 5
		skills = skills.filter(
			(skill) =>
				!["Tracer"].includes(skill) || ns.bladeburner.getSkillLevel(skill) < 10,
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
function pick_city(ns: NS) {
	var cities = CITIES;

	cities.sort((a, b) => {
		return (
			ns.bladeburner.getCityEstimatedPopulation(b as CityName) -
			ns.bladeburner.getCityEstimatedPopulation(a as CityName)
		);
	});
	ns.bladeburner.switchCity(cities[0] as CityName);
}

/**
 * Lowers chaos in the current city by starting the "Stealth Retirement Operation" if conditions are met, or defaults to "Diplomacy" if not.
 *
 * @param {NS} ns - The Bitburner API object.
 */
function lower_chaos(ns: NS) {
	var current_action = ns.bladeburner.getCurrentAction()?.name;

	var current_population = ns.bladeburner.getCityEstimatedPopulation(
		ns.bladeburner.getCity(),
	);

	var chance = ns.bladeburner.getActionEstimatedSuccessChance(
		"Operations",
		"Stealth Retirement Operation",
	);
	var succes = (chance[0] + chance[1]) / 2;
	if (
		succes >= 0.66 &&
		current_population >= 0.5e9 &&
		current_action != "Stealth Retirement Operation" &&
		ns.bladeburner.getActionCountRemaining(
			"Operations",
			"Stealth Retirement Operation",
		) >= 100
	) {
		ns.bladeburner.startAction("Operations", "Stealth Retirement Operation");
	} else if (current_action != "Diplomacy") {
		ns.bladeburner.startAction("General", "Diplomacy");
	}
}
