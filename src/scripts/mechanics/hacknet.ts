import { HacknetServerHashUpgrade, NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";
import { scan } from "../servers/scan";

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

// ---------------------- //
// HACKNET NODE FUNCTIONS //
// ---------------------- //

export function manageHacknetNodes(ns: NS) {
	let rush = !ns.getPlayer().factions.includes("Netburners");

	const numNodes = ns.hacknet.numNodes();
	if (numNodes < ns.hacknet.maxNumNodes()) {
		while (purchaseHacknetNode(ns, true)) {
			continue;
		}
	}

	for (let i = 0; i < numNodes; i++) {
		if (ns.fileExists("Formulas.exe")) {
			let upgradeCounter = 0;
			while (upgradeNode(ns, rush)) {
				upgradeCounter += 1;
			}
			if (upgradeCounter > 0) {
				ns.print(
					`${getTimestamp()} Purchased ${upgradeCounter} hacknet upgrade(s)`,
				);
			}
		} else {
			upgradeLevel(ns, i, rush, 10);
			upgradeRam(ns, i, rush);
			upgradeCores(ns, i, rush);
		}
	}
}

function purchaseHacknetNode(ns: NS, rush: boolean = false): boolean {
	const moneyPerc = rush ? 1 : 0.1;
	if (ns.getPlayer().money * moneyPerc > ns.hacknet.getPurchaseNodeCost()) {
		const nodeIndex = ns.hacknet.purchaseNode();
		if (ns.hacknet.hashCapacity() > 0) {
			ns.print(`${getTimestamp()} Purchased hacknet-server-${nodeIndex}`);
		} else {
			ns.print(`${getTimestamp()} Purchased hacknet-node-${nodeIndex}`);
		}
		return true;
	} else {
		return false;
	}
}

function upgradeNode(ns: NS, rush: boolean = false): boolean {
	const upgradeValues = [];
	for (let i = 0; i < ns.hacknet.numNodes(); i++) {
		upgradeValues.push(getBestNodeUpgrade(ns, i));
	}
	const bestUpgrade = upgradeValues.sort((a, b) => b[1][1] - a[1][1])[0];
	const index = bestUpgrade[0];
	const type = bestUpgrade[1][0];
	switch (type) {
		case "level":
			return upgradeLevel(ns, index, rush);
		case "ram":
			return upgradeRam(ns, index, rush);
		case "cores":
			return upgradeCores(ns, index, rush);
		default:
			return false;
	}
}

function getBestNodeUpgrade(ns: NS, index: number): [number, [string, number]] {
	const results: [string, number][] = [
		[
			"level",
			calculateNodeResult(ns, index, "level") /
				ns.hacknet.getLevelUpgradeCost(index),
		],
		[
			"ram",
			calculateNodeResult(ns, index, "ram") /
				ns.hacknet.getRamUpgradeCost(index),
		],
		[
			"cores",
			calculateNodeResult(ns, index, "cores") /
				ns.hacknet.getCoreUpgradeCost(index),
		],
	];
	results.sort((a, b) => b[1] - a[1]);
	return [index, results[0]];
}

function calculateNodeResult(
	ns: NS,
	index: number,
	upgradeType: string,
): number {
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

function upgradeLevel(
	ns: NS,
	index: number,
	rush: boolean,
	levelCount: number = 1,
): boolean {
	const moneyPerc = rush ? 1 : 0.1;
	levelCount = Math.min(
		levelCount,
		200 - ns.hacknet.getNodeStats(index).level,
	);
	if (
		ns.getPlayer().money * moneyPerc >
		ns.hacknet.getLevelUpgradeCost(index, levelCount)
	) {
		return ns.hacknet.upgradeLevel(index, levelCount);
	} else {
		return false;
	}
}

function upgradeRam(ns: NS, index: number, rush: boolean = false): boolean {
	const moneyPerc = rush ? 1 : 0.1;
	if (
		ns.getPlayer().money * moneyPerc >
		ns.hacknet.getRamUpgradeCost(index)
	) {
		return ns.hacknet.upgradeRam(index);
	} else {
		return false;
	}
}

function upgradeCores(ns: NS, index: number, rush: boolean = false): boolean {
	const moneyPerc = rush ? 1 : 0.1;
	if (
		ns.getPlayer().money * moneyPerc >
		ns.hacknet.getCoreUpgradeCost(index)
	) {
		return ns.hacknet.upgradeCore(index);
	} else {
		return false;
	}
}

// ----------------------- //
// HACNET SERVER FUNCTIONS //
// ----------------------- //

export function manageHacknetServers(ns: NS) {
	const numNodes = ns.hacknet.numNodes();

	for (let i = 0; i < numNodes; i++) {
		upgradeCache(ns, i);
	}

	while (spendHashes(ns)) {
		continue;
	}
}

function upgradeCache(ns: NS, index: number): boolean {
	if (ns.getPlayer().money * 0.1 > ns.hacknet.getCacheUpgradeCost(index)) {
		return ns.hacknet.upgradeCache(index);
	} else {
		return false;
	}
}

function spendHashes(ns: NS): boolean {
	let upgrade = getHashUpgrades(ns)[0];
	const targetServer = ""; // TODO
	const targetCompany = "";

	if (upgrade == undefined) {
		upgrade = "Sell for Money";
	}

	// const target = upgrade == "Company Favor" ? targetCompany : targetServer
	const target = targetServer;

	return ns.hacknet.spendHashes(upgrade, target);
}

function getHashUpgrades(ns: NS) {
	const upgrades = ns.hacknet
		.getHashUpgrades()
		.filter(
			(upgrade) =>
				isUsefulUpgrade(ns, upgrade) &&
				ns.hacknet.hashCost(upgrade) < getTotalHashGain(ns) * 30 &&
				ns.hacknet.hashCost(upgrade) < ns.hacknet.hashCapacity(),
		);
	return upgrades.sort(
		(a, b) => ns.hacknet.hashCost(a) - ns.hacknet.hashCost(b),
	);
}

function getTotalHashGain(ns: NS) {
	let totalHashGain = 0;
	for (let i = 0; i < ns.hacknet.numNodes(); i++) {
		totalHashGain += ns.hacknet.getNodeStats(i).production;
	}
	return totalHashGain;
}

function isUsefulUpgrade(ns: NS, upgrade: HacknetServerHashUpgrade): boolean {
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

	const improveUpgrades: HacknetServerHashUpgrade[] = [
		"Improve Studying",
		"Improve Gym Training",
	];
	if (
		ns.hacknet.getHashUpgradeLevel(upgrade) >= 5 &&
		improveUpgrades.includes(upgrade)
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
