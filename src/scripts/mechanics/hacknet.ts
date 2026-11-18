import { HacknetServerHashUpgrade, NS } from "@ns";
import { managerClass } from "../library/manager";

export class hacknetManager extends managerClass {
	constructor(ns: NS) {
		super(ns, "Hacknet");
	}

	tick(ns: NS) {
		this.manageHacknetNodes(ns);
		this.manageHacknetServers(ns);
	}

	// ---------------------- //
	// HACKNET NODE FUNCTIONS //
	// ---------------------- //

	manageHacknetNodes(ns: NS) {
		const numNodes = ns.hacknet.numNodes();
		if (numNodes < ns.hacknet.maxNumNodes()) {
			while (this.purchaseHacknetNode(ns)) {
				continue;
			}
		}

		for (let i = 0; i < numNodes; i++) {
			if (ns.fileExists("Formulas.exe")) {
				let upgradeCounter = 0;
				while (this.upgradeNode(ns)) {
					upgradeCounter += 1;
				}
				if (upgradeCounter > 0) {
					this.log(
						ns,
						`Purchased ${upgradeCounter} hacknet upgrade(s).`,
					);
				}
			} else {
				this.upgradeLevel(ns, i, 10);
				this.upgradeRam(ns, i);
				this.upgradeCores(ns, i);
			}
		}
	}

	purchaseHacknetNode(ns: NS): boolean {
		if (ns.getPlayer().money * 0.1 > ns.hacknet.getPurchaseNodeCost()) {
			const nodeIndex = ns.hacknet.purchaseNode();
			if (ns.hacknet.hashCapacity() > 0) {
				this.log(ns, `Purchased hacknet-server-${nodeIndex}.`);
			} else {
				this.log(ns, `Purchased hacknet-node-${nodeIndex}.`);
			}
			return true;
		} else {
			return false;
		}
	}

	upgradeNode(ns: NS): boolean {
		const upgradeValues = [];
		for (let i = 0; i < ns.hacknet.numNodes(); i++) {
			upgradeValues.push(this.getBestNodeUpgrade(ns, i));
		}
		const bestUpgrade = upgradeValues.sort((a, b) => b[1][1] - a[1][1])[0];
		const index = bestUpgrade[0];
		const type = bestUpgrade[1][0];
		switch (type) {
			case "level":
				return this.upgradeLevel(ns, index);
			case "ram":
				return this.upgradeRam(ns, index);
			case "cores":
				return this.upgradeCores(ns, index);
			default:
				return false;
		}
	}

	getBestNodeUpgrade(ns: NS, index: number): [number, [string, number]] {
		const results: [string, number][] = [
			[
				"level",
				this.calculateNodeResult(ns, index, "level") /
					ns.hacknet.getLevelUpgradeCost(index),
			],
			[
				"ram",
				this.calculateNodeResult(ns, index, "ram") /
					ns.hacknet.getRamUpgradeCost(index),
			],
			[
				"cores",
				this.calculateNodeResult(ns, index, "cores") /
					ns.hacknet.getCoreUpgradeCost(index),
			],
		];
		results.sort((a, b) => b[1] - a[1]);
		return [index, results[0]];
	}

	calculateNodeResult(ns: NS, index: number, upgradeType: string): number {
		const node = ns.hacknet.getNodeStats(index);
		const isServer = ns.hacknet.hashCapacity() > 0;

		function getProductionRate(
			level: number,
			ram: number,
			cores: number,
		): number {
			return isServer
				? ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores)
				: ns.formulas.hacknetNodes.moneyGainRate(level, ram, cores);
		}

		const currentProduction = getProductionRate(
			node.level,
			node.ram,
			node.cores,
		);

		switch (upgradeType) {
			case "level":
				return (
					getProductionRate(node.level + 1, node.ram, node.cores) -
					currentProduction
				);
			case "ram":
				return (
					getProductionRate(node.level, node.ram * 2, node.cores) -
					currentProduction
				);
			case "cores":
				return (
					getProductionRate(node.level, node.ram, node.cores + 1) -
					currentProduction
				);
			default:
				return 0;
		}
	}

	upgradeLevel(ns: NS, index: number, levelCount: number = 1): boolean {
		levelCount = Math.min(
			levelCount,
			200 - ns.hacknet.getNodeStats(index).level,
		);
		if (
			ns.getPlayer().money * 0.1 >
			ns.hacknet.getLevelUpgradeCost(index, levelCount)
		) {
			return ns.hacknet.upgradeLevel(index, levelCount);
		} else {
			return false;
		}
	}

	upgradeRam(ns: NS, index: number): boolean {
		if (ns.getPlayer().money * 0.1 > ns.hacknet.getRamUpgradeCost(index)) {
			return ns.hacknet.upgradeRam(index);
		} else {
			return false;
		}
	}

	upgradeCores(ns: NS, index: number): boolean {
		if (ns.getPlayer().money * 0.1 > ns.hacknet.getCoreUpgradeCost(index)) {
			return ns.hacknet.upgradeCore(index);
		} else {
			return false;
		}
	}

	// ----------------------- //
	// HACNET SERVER FUNCTIONS //
	// ----------------------- //

	manageHacknetServers(ns: NS) {
		const numNodes = ns.hacknet.numNodes();

		for (let i = 0; i < numNodes; i++) {
			this.upgradeCache(ns, i);
		}

		while (this.spendHashes(ns)) {
			continue;
		}
	}

	upgradeCache(ns: NS, index: number): boolean {
		if (
			ns.getPlayer().money * 0.1 >
			ns.hacknet.getCacheUpgradeCost(index)
		) {
			return ns.hacknet.upgradeCache(index);
		} else {
			return false;
		}
	}

	spendHashes(ns: NS): boolean {
		let upgrade = this.getHashUpgrades(ns)[0];
		const targetServer = ""; // TODO
		const targetCompany = "";

		if (upgrade == undefined) {
			upgrade = "Sell for Money";
		}

		// const target = upgrade == "Company Favor" ? targetCompany : targetServer
		const target = targetServer;

		return ns.hacknet.spendHashes(upgrade, target);
	}

	getHashUpgrades(ns: NS) {
		const upgrades = ns.hacknet
			.getHashUpgrades()
			.filter(
				(upgrade) =>
					this.isUsefulUpgrade(ns, upgrade) &&
					ns.hacknet.hashCost(upgrade) <
						this.getTotalHashGain(ns) * 120 &&
					ns.hacknet.hashCost(upgrade) < ns.hacknet.hashCapacity(),
			);
		return upgrades.sort(
			(a, b) => ns.hacknet.hashCost(a) - ns.hacknet.hashCost(b),
		);
	}

	getTotalHashGain(ns: NS) {
		let totalHashGain = 0;
		for (let i = 0; i < ns.hacknet.numNodes(); i++) {
			totalHashGain += ns.hacknet.getNodeStats(i).production;
		}
		return totalHashGain;
	}

	isUsefulUpgrade(ns: NS, upgrade: HacknetServerHashUpgrade): boolean {
		if (upgrade == "Sell for Money") {
			return false;
		}

		const corporationUpgrades: HacknetServerHashUpgrade[] = [
			"Sell for Corporation Funds",
			"Exchange for Corporation Research",
		];
		if (
			!ns.corporation.hasCorporation() &&
			corporationUpgrades.includes(upgrade)
		) {
			return false;
		}

		const serverUpgrades: HacknetServerHashUpgrade[] = [
			"Reduce Minimum Security",
			"Increase Maximum Money",
		];
		if (serverUpgrades.includes(upgrade)) {
			return false;
		}

		const bladeburnerUpgrades: HacknetServerHashUpgrade[] = [
			"Exchange for Bladeburner Rank",
			"Exchange for Bladeburner SP",
		];
		if (
			!ns.bladeburner.inBladeburner() &&
			bladeburnerUpgrades.includes(upgrade)
		) {
			return false;
		}

		if (upgrade == "Improve Studying") {
			return false;
		}

		if (
			upgrade == "Improve Gym Training" &&
			ns.hacknet.getHashUpgradeLevel(upgrade) >= 5
		) {
			return false;
		}

		if (upgrade == "Generate Coding Contract") {
			return false;
		}

		if (upgrade == "Company Favor") {
			return false;
		}

		return true;
	}
}

export async function main(ns: NS): Promise<void> {
	let alertString = "HACKNET OVERVIEW";

	const numNodes = ns.hacknet.numNodes();
	for (let i = 0; i < numNodes; i++) {
		const node = ns.hacknet.getNodeStats(i);
		alertString = alertString.concat(
			`\n${node.name} level: ${node.level}, RAM: ${node.ram}, cores: ${node.cores}`,
		);
	}

	ns.alert(alertString);
}
