/**
 * Formats a given amount of money into a human-readable string with appropriate suffixes.
 *
 * @param {number} money - The amount of money to format.
 * @returns {string} - The formatted money string.
 */
export function getMoney(money: number): string {
	let money_string = "$" + String(money);

	if (money / 1000 >= 1 && money / 1e6 < 1) {
		money_string = "$" + String((money / 1000).toFixed(3)) + "K";
	} else if (money / 1e6 >= 1 && money / 1e9 < 1) {
		money_string = "$" + String((money / 1e6).toFixed(3)) + "m";
	} else if (money / 1e9 >= 1 && money / 1e12 < 1) {
		money_string = "$" + String((money / 1e9).toFixed(3)) + "b";
	}

	return money_string;
}
