/**
 * Gets the current timestamp in a human-readable format.
 *
 * @returns {string} The current timestamp formatted as "[HH:MM:SS]".
 */
export function get_timestamp(): string {
	var d = new Date();

	var timestamp_string = convert_date(d);

	var timestamp =
		"[" +
		timestamp_string["hour"] +
		":" +
		timestamp_string["minute"] +
		":" +
		timestamp_string["second"] +
		"]";
	return timestamp;
}

/**
 * Converts a Date object into an object containing formatted hour, minute, and second strings.
 *
 * @param {Date} date - The Date object to convert.
 * @returns {Object} An object containing the formatted time components.
 */
function convert_date(date: Date): { hour: string; minute: string; second: string } {
	var hour = date.getHours();
	var minute = date.getMinutes();
	var second = date.getSeconds();

	var hour_string = String(hour);
	if (hour < 10) {
		hour_string = "0" + String(hour);
	}

	var minute_string = String(minute);
	if (minute < 10) {
		minute_string = "0" + String(minute);
	}

	var second_string = String(second);
	if (second < 10) {
		second_string = "0" + String(second);
	}

	return { hour: hour_string, minute: minute_string, second: second_string };
}

/**
 * Gets the timestamp for a future time based on the current time and a delay in milliseconds.
 *
 * @param {number} ms - The delay in milliseconds.
 * @returns {string} The timestamp for the future time formatted as "HH:MM:SS".
 */
export function get_target_time(ms: number): string {
	var d = new Date();
	var current_ms = d.getMilliseconds();
	d.setMilliseconds(current_ms + ms);

	var timestamp_string = convert_date(d);

	var timestamp =
		timestamp_string["hour"] +
		":" +
		timestamp_string["minute"] +
		":" +
		timestamp_string["second"];
	return timestamp;
}
