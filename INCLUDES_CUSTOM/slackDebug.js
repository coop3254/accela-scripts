function slackDebug(msg) {
	var channel = lookup("EventExceptionLog", "LogChannel");
	var headers = aa.util.newHashMap();
	headers.put("Content-Type", "application/json");

	if (arguments.length == 2) {
		var otherChannel = lookup("EventExceptionLog", arguments[1]);
		if (otherChannel) {
			channel = otherChannel;
		}
	}

	var body = {};
	body.text = "<!here> " + aa.getServiceProviderCode() + "::" + lookup("EventExceptionLog", "Environment") + ":: says - " + msg;

	if (channel) {
		var result = aa.httpClient.post("https://hooks.slack.com/services/" + channel, headers, JSON.stringify(body));

		if (!result.getSuccess()) {
			logDebug("Slack get anonymous token error: " + result.getErrorMessage());
		}
	}
}
