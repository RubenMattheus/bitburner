import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	let alertString = `SCRIPT OVERVIEW\n`;

	const scripts = ns.ls("home", "/main/");
	for (let script of scripts) {
		alertString = alertString.concat(
			`\n${script.split("main/")[1]}: ${ns.format.ram(ns.getScriptRam(script))} RAM`,
		);
	}

	alertString = alertString.concat(
		`\n\nCurrent free RAM: ${ns.format.ram(ns.getServerMaxRam() - ns.getServerUsedRam())}/${ns.format.ram(ns.getServerMaxRam())}`,
	);

	ns.alert(alertString);
}
