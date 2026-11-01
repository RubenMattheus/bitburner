import { NS } from "@ns";
import { getTimestamp } from "../logging/timestamp";

export async function main(ns: NS): Promise<void> {
	const numNodes = ns.hacknet.numNodes();
	for (let i = 0; i < numNodes; i++) {
		const nodeStats = ns.hacknet.getNodeStats(i);
		ns.tprint("/--- " + nodeStats.name + " ---/");
		ns.tprint(
			"level: " +
				nodeStats.level +
				" // RAM " +
				nodeStats.ram +
				" // CORES " +
				nodeStats.cores,
		);
	}
}

export function manageHacknetNodes(ns: NS) {
	const numNodes = ns.hacknet.numNodes();

	if (numNodes < ns.hacknet.maxNumNodes()) {
		purchaseHacknetNodes(ns);
	}

	for (let i = 0; i < numNodes; i++) {
		upgradeLevel(ns, i);
		upgradeRam(ns, i);
		upgradeCores(ns, i);
	}
}

function purchaseHacknetNodes(ns: NS) {
	if (ns.getPlayer().money * 0.1 > ns.hacknet.getPurchaseNodeCost()) {
		const nodeIndex = ns.hacknet.purchaseNode();
		ns.print(getTimestamp() + " Purchased hacknet-node-" + nodeIndex);
	}
}

function upgradeLevel(ns: NS, index: number) {
	const levelCount = Math.min(10, 200 - ns.hacknet.getNodeStats(index).level);
	if (
		ns.getPlayer().money * 0.1 >
		ns.hacknet.getLevelUpgradeCost(index, levelCount)
	) {
		ns.hacknet.upgradeLevel(index, levelCount);
	}
}

function upgradeRam(ns: NS, index: number) {
	if (ns.getPlayer().money * 0.1 > ns.hacknet.getRamUpgradeCost(index)) {
		ns.hacknet.upgradeRam(index);
	}
}

function upgradeCores(ns: NS, index: number) {
	if (ns.getPlayer().money * 0.1 > ns.hacknet.getCoreUpgradeCost(index)) {
		ns.hacknet.upgradeCore(index);
	}
}
