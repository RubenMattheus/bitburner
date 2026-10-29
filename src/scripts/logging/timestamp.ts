/**
 * Gets the current timestamp in a human-readable format.
 *
 * @returns {string} The current timestamp formatted as "[HH:MM:SS]".
 */
export function getTimestamp(): string {
	const d = new Date();

	const timestampString = convertDate(d);

	const timestamp =
		"[" +
		timestampString["hour"] +
		":" +
		timestampString["minute"] +
		":" +
		timestampString["second"] +
		"]";
	return timestamp;
}

/**
 * Converts a Date object into an object containing formatted hour, minute, and second strings.
 *
 * @param {Date} date - The Date object to convert.
 * @returns {Object} An object containing the formatted time components.
 */
function convertDate(date: Date): { hour: string; minute: string; second: string } {
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();

	let hourString = String(hour);
	if (hour < 10) {
		hourString = "0" + String(hour);
	}

	let minuteString = String(minute);
	if (minute < 10) {
		minuteString = "0" + String(minute);
	}

	let secondString = String(second);
	if (second < 10) {
		secondString = "0" + String(second);
	}

	return { hour: hourString, minute: minuteString, second: secondString };
}

/**
 * Gets the timestamp for a future time based on the current time and a delay in milliseconds.
 *
 * @param {number} ms - The delay in milliseconds.
 * @returns {string} The timestamp for the future time formatted as "HH:MM:SS".
 */
export function getTargetTime(ms: number): string {
	const d = new Date();
	const currentMs = d.getMilliseconds();
	d.setMilliseconds(currentMs + ms);

	const timestampString = convertDate(d);

	const timestamp =
		timestampString["hour"] +
		":" +
		timestampString["minute"] +
		":" +
		timestampString["second"];
	return timestamp;
}
