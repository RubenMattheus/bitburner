export function get_timestamp() {
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

function convert_date(date: Date) {
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

export function get_target_time(ms: number) {
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
