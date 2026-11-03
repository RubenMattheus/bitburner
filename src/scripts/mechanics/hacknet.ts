import { HacknetServerHashUpgrade, NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";

export async function main(ns: NS): Promise<void> {
	let alertString = "HACKNET OVERVIEW";

	const numNodes = ns.hacknet.numNodes();
	for (let i = 0; i < numNodes; i++) {
		const node = ns.hacknet.getNodeStats(i);
		alertString = alertString.concat(
			"\n" +
				node.name +
				" level: " +
				node.level +
				", RAM: " +
				node.ram +
				", cores: " +
				node.cores,
		);
	}

	ns.alert(alertString);
}

// ---------------------- //
// HACKNET NODE FUNCTIONS //
// ---------------------- //

export function manageHacknetNodes(ns: NS, rush: boolean = false) {
	const numNodes = ns.hacknet.numNodes();

	if (numNodes < ns.hacknet.maxNumNodes()) {
		purchaseHacknetNode(ns, true);
	}

	for (let i = 0; i < numNodes; i++) {
		if (ns.fileExists("Formulas.exe")) {
			upgradeNode(ns, i, rush);
		} else {
			upgradeLevel(ns, i, rush);
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
			ns.print(getTimestamp() + " Purchased hacknet-server-" + nodeIndex);
		} else {
			ns.print(getTimestamp() + " Purchased hacknet-node-" + nodeIndex);
		}
		return true;
	} else {
		return false;
	}
}

function upgradeNode(ns: NS, index: number, rush: boolean = false): boolean {
	const type = getBestNodeUpgrade(ns, index);
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

function getBestNodeUpgrade(ns: NS, index: number): string {
	const levelCount = Math.min(10, 200 - ns.hacknet.getNodeStats(index).level);
	const results: [string, number][] = [
		[
			"level",
			calculateNodeResult(ns, index, "level", levelCount) /
				ns.hacknet.getLevelUpgradeCost(index, levelCount),
		],
		[
			"ram",
			calculateNodeResult(ns, index, "ram") / ns.hacknet.getRamUpgradeCost(index),
		],
		[
			"cores",
			calculateNodeResult(ns, index, "cores") /
				ns.hacknet.getCoreUpgradeCost(index),
		],
	];
	results.sort((a, b) => b[1] - a[1]);
	return results[0][0];
}

function calculateNodeResult(
	ns: NS,
	index: number,
	upgradeType: string,
	levelCount: number = 1,
): number {
	const node = ns.hacknet.getNodeStats(index);
	const isServer = ns.hacknet.hashCapacity() > 0;

	function getProductionRate(level: number, ram: number, cores: number): number {
		return isServer
			? ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores)
			: ns.formulas.hacknetNodes.moneyGainRate(level, ram, cores);
	}

	const currentProduction = getProductionRate(node.level, node.ram, node.cores);

	switch (upgradeType) {
		case "level":
			return (
				getProductionRate(node.level + levelCount, node.ram, node.cores) -
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

function upgradeLevel(ns: NS, index: number, rush: boolean = false): boolean {
	const moneyPerc = rush ? 1 : 0.1;
	const levelCount = Math.min(10, 200 - ns.hacknet.getNodeStats(index).level);
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
	if (ns.getPlayer().money * moneyPerc > ns.hacknet.getRamUpgradeCost(index)) {
		return ns.hacknet.upgradeRam(index);
	} else {
		return false;
	}
}

function upgradeCores(ns: NS, index: number, rush: boolean = false): boolean {
	const moneyPerc = rush ? 1 : 0.1;
	if (ns.getPlayer().money * moneyPerc > ns.hacknet.getCoreUpgradeCost(index)) {
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

	const upgrade = pickHashUpgrade(ns);
	const target = ""; // TODO
	const count = upgrade == "Sell for Money" ? getMaxUpgrade(ns, upgrade) : 1;
	ns.hacknet.spendHashes(upgrade, target, count);
}

function upgradeCache(ns: NS, index: number) {
	if (ns.getPlayer().money * 0.1 > ns.hacknet.getCacheUpgradeCost(index)) {
		ns.hacknet.upgradeCache(index);
	}
}

function pickHashUpgrade(ns: NS): HacknetServerHashUpgrade {
	const totalHashGain = getTotalHashGain(ns);

	if (ns.hacknet.hashCost("Improve Gym Training") < totalHashGain * 90) {
		return "Improve Gym Training";
	}
	// else if (ns.hacknet.hashCost("Improve Studying") < totalHashGain * 90) {
	// 	return "Improve Studying";
	// }
	else {
		return "Sell for Money";
	}
}

function getMaxUpgrade(ns: NS, upgrade: HacknetServerHashUpgrade): number {
	const upgradeCost = ns.hacknet.hashCost(upgrade);
	const currentHashes = ns.hacknet.numHashes();

	return Math.floor(currentHashes / upgradeCost);
}

function getTotalHashGain(ns: NS) {
	let totalHashGain = 0;
	for (let i = 0; i < ns.hacknet.numNodes(); i++) {
		totalHashGain += ns.hacknet.getNodeStats(i).production;
	}
	return totalHashGain;
}
