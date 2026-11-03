/**
 * Converts a Date object into a string.
 *
 * @param {Date} date - The Date object to convert.
 * @returns {Object} An object containing the formatted time components.
 */
function formatDate(date: Date): string {
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");

	return "[" + hours + ":" + minutes + ":" + seconds + "]";
}

/**
 * Gets the current timestamp in a human-readable format.
 *
 * @returns {string} The current timestamp formatted as "[HH:MM:SS]".
 */
export function getTimestamp(): string {
	return formatDate(new Date());
}

/**
 * Gets the timestamp for a future time based on the current time and a delay in milliseconds.
 *
 * @param {number} ms - The delay in milliseconds.
 * @returns {string} The timestamp for the future time formatted as "HH:MM:SS".
 */
export function getTargetTime(ms: number): string {
	return formatDate(new Date(Date.now() + ms));
}
