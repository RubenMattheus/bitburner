import { NS, GangTaskStats } from "@ns";
import { getTargetTime } from "../logging/timestamp";
import { managerClass } from "../library/manager";

export class gangManager extends managerClass {
	type: string;

	constructor(ns: NS, type: string) {
		super(ns, "Gang");
		this.type = type;
	}

	tick(ns: NS) {
		if (!ns.gang.inGang()) {
			this.createGang(ns);
		} else {
			this.recruitMembers(ns);
			this.setMemberActions(ns);
		}
	}

	createGang(ns: NS) {
		this.type == "Hacking"
			? ns.gang.createGang("NiteSec")
			: ns.gang.createGang("Slum Snakes");
	}

	/**
	 * Renames gang members to "memberX" where X is the member's index + 1.
	 *
	 * Recruits new members with names "memberX" where X is the next available index.
	 *
	 * @param {NS} ns - The Bitburner API object.
	 */
	recruitMembers(ns: NS) {
		while (ns.gang.canRecruitMember()) {
			const name = `#${String(ns.gang.getMemberNames().length + 1)}`;
			ns.gang.recruitMember(name);
			this.log(ns, `Recruited ${name}.`);
		}
	}

	/**
	 * Sets the actions for gang members.
	 *
	 * @param {NS} ns - The Bitburner API object.
	 */
	setMemberActions(ns: NS) {
		const gang = ns.gang.getGangInformation();
		const isHacking = gang.isHacking;
		const members = ns.gang.getMemberNames();

		for (let member of members) {
			this.ascend(ns, member);
			this.purchaseEquipment(ns, member);
		}

		function getCombatTotal(member: string) {
			const stats = ns.gang.getMemberInformation(member);
			return stats.str + stats.def + stats.dex + stats.agi;
		}

		if (isHacking) {
			members.sort(
				(a, b) =>
					ns.gang.getMemberInformation(b).hack -
					ns.gang.getMemberInformation(a).hack,
			);
		} else {
			members.sort((a, b) => getCombatTotal(b) - getCombatTotal(a));
		}

		const div = Math.floor(members.length / 3);
		const topMembers = members.slice(0, div);
		const midMembers = members.slice(div, div * 2);
		const botMembers = members.slice(div * 2);

		const highPenalty = gang.wantedLevel > 10 && gang.wantedPenalty < 0.99;
		const needPower =
			gang.territory != 1 &&
			!this.territoryClash(ns) &&
			ns.gang.getMemberNames().length >= 12 &&
			gang.territoryClashChance == 0;

		for (let member of topMembers) {
			if (needPower) {
				this.setTask(ns, member, "warfare");
			} else if (highPenalty) {
				this.setTask(ns, member, "wanted");
			} else if (ns.gang.getMemberNames().length < 12) {
				this.setTask(ns, member, "respect");
			} else {
				this.setTask(ns, member, "money");
			}
		}
		for (let member of midMembers) {
			if (needPower) {
				this.setTask(ns, member, "warfare");
			} else {
				this.setTask(ns, member, "respect");
			}
		}
		for (let member of botMembers) {
			this.setTask(ns, member, "training");
		}

		for (let member of members) {
			if (this.trainingNeeded(ns, member)) {
				this.setTask(ns, member, "training");
			}
		}
	}

	setTask(
		ns: NS,
		member: string,
		goal: "respect" | "wanted" | "money" | "warfare" | "training",
	) {
		const isHacking = ns.gang.getGangInformation().isHacking;
		switch (goal) {
			case "respect":
				return ns.gang.setMemberTask(
					member,
					this.getOptimalTask(ns, member, "respect"),
				);
			case "wanted":
				return ns.gang.setMemberTask(
					member,
					this.getOptimalTask(ns, member, "wanted"),
				);
			case "money":
				return ns.gang.setMemberTask(
					member,
					this.getOptimalTask(ns, member, "money"),
				);
			case "warfare":
				return ns.gang.setMemberTask(member, "Territory Warfare");
			case "training":
				return ns.gang.setMemberTask(
					member,
					isHacking ? "Train Hacking" : "Train Combat",
				);
		}
	}

	getOptimalTask(
		ns: NS,
		member: string,
		goal: "respect" | "wanted" | "money",
	): string {
		const gang = ns.gang.getGangInformation();
		const memberInfo = ns.gang.getMemberInformation(member);
		const isHacking = gang.isHacking;
		let tasks = ns.gang.getTaskNames().filter((t) => t != "Unassigned");
		tasks = tasks.filter((t) =>
			isHacking
				? ns.gang.getTaskStats(t).isHacking
				: ns.gang.getTaskStats(t).isCombat,
		);

		const wantedTask = tasks.sort(
			(a, b) =>
				ns.formulas.gang.wantedLevelGain(
					gang,
					memberInfo,
					ns.gang.getTaskStats(a),
				) -
				ns.formulas.gang.wantedLevelGain(
					gang,
					memberInfo,
					ns.gang.getTaskStats(b),
				),
		)[0];

		const moneyTask = tasks.sort(
			(a, b) =>
				ns.formulas.gang.moneyGain(
					gang,
					memberInfo,
					ns.gang.getTaskStats(b),
				) -
				ns.formulas.gang.moneyGain(
					gang,
					memberInfo,
					ns.gang.getTaskStats(a),
				),
		)[0];

		if (goal == "wanted") {
			return wantedTask;
		} else if (goal == "money") {
			return moneyTask;
		}

		const wantedTaskStats = ns.gang.getTaskStats(wantedTask);

		function respectTaskValue(taskStats: GangTaskStats) {
			return (
				ns.formulas.gang.respectGain(gang, memberInfo, taskStats) /
				(1 +
					Math.abs(
						ns.formulas.gang.wantedLevelGain(
							gang,
							memberInfo,
							taskStats,
						) /
							ns.formulas.gang.wantedLevelGain(
								gang,
								memberInfo,
								wantedTaskStats,
							),
					))
			);
		}

		return tasks.sort(
			(a, b) =>
				respectTaskValue(ns.gang.getTaskStats(b)) -
				respectTaskValue(ns.gang.getTaskStats(a)),
		)[0];
	}

	trainingNeeded(ns: NS, memberName: string): boolean {
		const isHacking = ns.gang.getGangInformation().isHacking;
		const member = ns.gang.getMemberInformation(memberName);

		if (isHacking) {
			return member.hack < member.hack_asc_mult * 100;
		} else {
			return (
				member.str < member.str_asc_mult * 100 ||
				member.def < member.def_asc_mult * 100 ||
				member.dex < member.dex_asc_mult * 100 ||
				member.agi < member.agi_asc_mult * 100
			);
		}
	}

	/**
	 * Checks to see if it is a good moment to start territory warfare.
	 *
	 * Toggles clashes on if the average win chance is 80% and gang power is at least 500.
	 *
	 * Toggles clashes off if the average win chance is lower than 80%.
	 *
	 * @param {NS} ns - The Bitburner API object.
	 * @returns {boolean} True if average win chance against enemy gangs is at least 80% and gang power is 500, false otherwise
	 */
	territoryClash(ns: NS): boolean {
		const gangs = ns.gang.getAllGangInformation();

		const filtered: string[] = Object.entries(gangs)
			.filter(
				([name, info]) =>
					name != ns.gang.getGangInformation().faction &&
					info.territory > 0,
			)
			.map(([name]) => name);

		if (filtered.some((g) => ns.gang.getChanceToWinClash(g) < 0.8)) {
			ns.gang.setTerritoryWarfare(false);
			return false;
		} else if (ns.gang.getGangInformation().power >= 500) {
			ns.gang.setTerritoryWarfare(true);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Checks if any of the member's useful stat multipliers would double after ascending, and ascends the member if so.
	 *
	 * @param {NS} ns - The Bitburner API object.
	 * @param {string} member - The name of the gang member to check for ascension.
	 */
	ascend(ns: NS, member: string) {
		const result = ns.gang.getAscensionResult(member);
		if (result == undefined) {
			return;
		}

		const ascensionResult = ns.gang.getAscensionResult(member);
		const isHacking = ns.gang.getGangInformation().isHacking;
		const relevantStats = isHacking
			? [ascensionResult?.hack]
			: [
					ascensionResult?.str,
					ascensionResult?.def,
					ascensionResult?.dex,
					ascensionResult?.agi,
				];
		if (relevantStats.every((s) => s != undefined && s >= 2)) {
			ns.gang.ascendMember(member);
			this.log(ns, `Ascended ${member}.`);
		}
	}

	/**
	 * Purchases equipment for a given member.
	 *
	 * @param {NS} ns - The Bitburner API object.
	 * @param {string} member - The name of the gang member to purchase equipment for.
	 */
	purchaseEquipment(ns: NS, member: string) {
		const isHacking = ns.gang.getGangInformation().isHacking;
		const equipmentList = ns.gang.getEquipmentNames();

		for (let equipment of equipmentList) {
			if (
				ns.gang.getEquipmentCost(equipment) >
				ns.getPlayer().money * 0.083
			) {
				continue;
			}

			const stats = ns.gang.getEquipmentStats(equipment);
			if (isHacking && "hack" in stats) {
				ns.gang.purchaseEquipment(member, equipment);
			} else {
				ns.gang.purchaseEquipment(member, equipment);
			}
		}
	}
}

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
	let alertString = `GANG OVERVIEW`;
	if (ns.gang.inGang()) {
		const gangs = ns.gang.getAllGangInformation();

		const filtered: string[] = Object.entries(gangs)
			.filter(
				([name, info]) =>
					name != ns.gang.getGangInformation().faction &&
					info.territory > 0,
			)
			.map(([name]) => name);

		let avgWin = 0;
		for (let gang of filtered) {
			avgWin += ns.gang.getChanceToWinClash(gang);
		}

		alertString = alertString.concat(
			`\nAverage chance to win clashes: ${ns.format.percent(avgWin / filtered.length)}`,
		);
	} else {
		const karma = ns.getPlayer().karma;
		alertString = alertString.concat(
			`\nCurrent karma: ${karma.toFixed(2)}`,
		);
		const karmaNeeded = -54000 - karma;
		alertString = alertString.concat(
			`\nLowering karma finishes at ${getTargetTime((-karmaNeeded * 1000) / ns.singularity.getCrimeChance("Homicide"))} if committing 'homicide'`,
		);
	}

	ns.alert(alertString);
}
