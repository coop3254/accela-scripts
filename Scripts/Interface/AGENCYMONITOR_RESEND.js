var showDebug = true;
var debug = "";
var br = "<BR>";

var retryAfter = aa.env.getValue("retryAfter");
var apiURL = aa.env.getValue("apiURL");
var headers = aa.env.getValue("headers");
var message = aa.env.getValue("message");

if (typeof message != "string") message = JSON.stringify(message);

if (!isNaN(retryAfter)) retryAfter = parseInt(retryAfter);

if (apiURL && headers && retryAfter && message) {
	do {
		wait(retryAfter * 1000);

		var res = aa.httpClient.post(apiURL, headers, JSON.stringify(body));

		if (!res.getSuccess()) {
			logDebug("Slack get anonymous token error: " + res.getErrorMessage());
			retryAfter = false;
		}

		if (retryAfter != false) {
			res.getOutput();
			if (res.status && res.status == 429) {
				retryAfter = response.headers["retry-after"];
			} else {
				retryAfter = false;
			}
		}
	} while (retryAfter != false);
} else {
	logDebug("AgencyMonitor could not resend message after rate limiting, a variable was not retrieved. apiURL: " + apiURL + ", headers: " + headers + ", retryAfter: " + retryAfter + ", message: " + message + "");
}

function logDebug(dstr) {
	var vLevel = 1;
	if (arguments.length > 1) vLevel = arguments[1];
	if ((showDebug & vLevel) == vLevel || vLevel == 1) debug += dstr + br;
	if ((showDebug & vLevel) == vLevel) aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr);
}

function wait(milliseconds) {
	var date = new Date().getTime();
	var currentDate = null;
	do {
		currentDate = new Date().getTime();
	} while (currentDate - date < milliseconds);
}
