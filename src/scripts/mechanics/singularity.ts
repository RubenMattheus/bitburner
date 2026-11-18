import {
	NS,
	GymType,
	CompanyName,
	JobField,
	CrimeType,
	ProgramName,
} from "@ns";
import { findServer, nuke } from "../library/shared";
import { managerClass } from "../library/manager";

export class singularityManager extends managerClass {
	constructor(ns: NS) {
		super(ns, "Singularity");
	}

	tick(ns: NS) {
		this.pickAction(ns);
		if (ns.singularity.upgradeHomeRam()) {
			this.log(
				ns,
				`Upgraded 'home' RAM to ${ns.format.ram(ns.getServerMaxRam("home"))}`,
			);
		}
	}

	pickAction(ns: NS): boolean {
		if (ns.getPlayer().money < 10e6) {
			return this.commitCrime(ns);
		}
		if (!this.checkCombatStats(ns)) {
			return this.raiseCombatStats(ns);
		} else if (ns.getPlayer().karma > -54000) {
			return this.commitCrime(ns);
		} else if (this.factionWork(ns)) {
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
	commitCrime(ns: NS) {
		function moneyPerSecond(crimeName: CrimeType) {
			const stats = ns.singularity.getCrimeStats(crimeName);
			const chance = ns.singularity.getCrimeChance(crimeName);
			return (stats.money * chance) / stats.time;
		}

		let crimes = Object.values(ns.enums.CrimeType);
		crimes = crimes.filter(
			(c) => ns.singularity.getCrimeStats(c).time < 60000,
		);
		crimes.sort((a, b) => moneyPerSecond(b) - moneyPerSecond(a));

		let crimeType: CrimeType = "Homicide";
		if (
			ns.getPlayer().money < 10e6 ||
			ns.singularity.getCrimeChance("Homicide") < 0.5
		) {
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

	workJob(ns: NS): boolean {
		const currentAction = ns.singularity.getCurrentWork();
		const job: [CompanyName, JobField] = [
			"FoodNStuff",
			"Part-time Employee",
		];

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

	checkCombatStats(ns: NS) {
		const skills = ns.getPlayer().skills;

		return (
			skills.strength >= 100 &&
			skills.defense >= 100 &&
			skills.dexterity >= 100 &&
			skills.agility >= 100
		);
	}

	raiseCombatStats(ns: NS): boolean {
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

	factionWork(ns: NS): boolean {
		const portRead = this.readPort(ns, 4);
		if (portRead == "NULL PORT DATA") {
			return false;
		}

		const nextFaction = portRead[0];

		if (!nextFaction) {
			return false;
		}

		if (ns.singularity.workForFaction(nextFaction, "security", false)) {
			return true;
		} else if (ns.singularity.workForFaction(nextFaction, "field", false)) {
			return true;
		} else if (
			ns.singularity.workForFaction(nextFaction, "hacking", false)
		) {
			return true;
		} else {
			return false;
		}
	}
}

export class serverBackdoorManager {
	servers = [
		"CSEC",
		"avmnite-02h",
		"I.I.I.I",
		"run4theh111z",
		"fulcrumassets",
	];

	constructor(ns: NS, finishBitnode: boolean) {
		if (finishBitnode) {
			this.servers.push("w0r1d_d43m0n");
		}
	}

	async tick(ns: NS): Promise<void> {
		this.setupTor(ns);
		nuke(ns);

		for (let s of this.servers) {
			await this.backdoor(ns, s);
		}
	}

	async backdoor(ns: NS, server: string): Promise<boolean> {
		if (findServer(ns, server).length == 0) {
			return false;
		}

		if (
			ns.hasRootAccess(server) &&
			ns.getServerRequiredHackingLevel(server) <
				ns.getPlayer().skills.hacking &&
			!ns.getServer(server).backdoorInstalled
		) {
			const serverPath = findServer(ns, server);
			for (let p of serverPath) {
				ns.singularity.connect(p);
			}

			await ns.singularity.installBackdoor();
			ns.singularity.connect("home");
			return true;
		} else {
			return false;
		}
	}

	setupTor(ns: NS): boolean {
		const programs: ProgramName[] = [
			"BruteSSH.exe",
			"FTPCrack.exe",
			"relaySMTP.exe",
			"HTTPWorm.exe",
			"SQLInject.exe",
		];

		if (ns.singularity.purchaseTor()) {
			for (let p of programs) {
				if (!ns.singularity.purchaseProgram(p)) {
					return false;
				}
			}
			return true;
		} else {
			return false;
		}
	}
}
