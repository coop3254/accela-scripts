function AgencyMonitor() {
	var configStr = aa.bizDomain.getBizDomain("EventExceptionLog");

	if (!configStr.getSuccess()) {
		logDebug("**WARNING: The AgencyMonitor configuration is not found!");
	}

	configStr = configStr.getOutput();
	var headers = aa.util.newHashMap();
	headers.put("Content-Type", "application/json");

	var config = {};
	if (config) {
		for (var v = 0; v < configStr.size(); v++) {
			var pair = configStr.get(v);
			config[pair.bizdomainValue] = pair.description;
		}
		if (!config.apiURL) {
			config.apiURL = "https://hooks.slack.com/services/";
		}

		this.Environment = config.Environment;
	}

	//Private Methods used internally
	var rateLimiter = function () {
		if (config.rateLimit == "YES") {
			var date = config.lastMessageTime ? config.lastMessageTime : new Date().getTime();
			var currentDate = null;
			var seconds = arguments[0] ? arguments[0] : 1;

			do {
				currentDate = new Date().getTime();
			} while (currentDate - date < seconds * 1000);
		}
		setLastMessage();
	};

	var rateCheck = function (res, apiURL, headers, body) {
		var resent = false;
		if (res.status && res.status == 429) {
			var retryAfter = res.headers["retry-after"];
			resent = retryAfter;

			if (getScriptText("AGENCYMONITOR_RESEND")) {
				aa.env.setValue("retryAfter", retryAfter);
				aa.env.setValue("apiURL", apiURL);
				aa.env.setValue("headers", headers);
				aa.env.setValue("message", body);

				aa.runScriptInNewTransaction("AGENCYMONITOR_RESEND");
			}
		}

		return resent;
	};

	var sendSlackMessage = function (channel, body) {
		var message = JSON.stringify(body);
		rateLimiter();
		var result = aa.httpClient.post(config.apiURL + channel, headers, message);

		if (result.getSuccess()) {
			result = result.getOutput();
			rateCheck(result, config.apiURL + channel, headers, message);
		} else {
			logDebug("Slack get anonymous token error: " + result.getErrorMessage());
			result.errorMessage = result.getErrorMessage();
			result.success = false;
		}

		return result;
	};

	var setLastMessage = function () {
		config.lastMessageTime = new Date().getTime();

		var time = aa.bizDomain.getBizDomainByValue("EventExceptionLog", "lastMessageTime");
		if (time.getOutput()) {
			time = time.getOutput().getBizDomain();
			time.setDescription(config.lastMessageTime);
			aa.bizDomain.editBizDomain(time);
		} else {
			aa.bizDomain.createBizDomain("EventExceptionLog", "lastMessageTime", "A", config.lastMessageTime);
		}

		return config.lastMessageTime;
	};

	var datetime = function () {
		var now = new Date();
		return [now.getMonth() + 1, now.getDate(), now.getFullYear()].join("/") + ":" + [now.getHours(), now.getMinutes(), now.getSeconds()].join(":");
	};

	//Public methods you can use
	this.log = function (msg) {
		var body = {};
		var channel = config.LogChannel;
		var context = arguments[2] ? arguments[2] : "";

		if (arguments[1]) {
			var otherChannel = config[arguments[1]];
			if (otherChannel) {
				channel = otherChannel;
			}
		}

		body.text = "<!here> #Log " + aa.getServiceProviderCode() + "::" + config.Environment + "::" + context + ":: says- " + msg + "\n" + datetime();

		if (arguments[1] == "DEBUG") {
			logDebug(body.text);
		} else if (arguments[1] == "PRINT") {
			aa.print(body.text);
		} else if (channel){
			var result = sendSlackMessage(channel, body);
			return result;
		}

		return body.text;
	};

	this.message = function (body) {
		var channel = config.LogChannel;

		if (arguments.length >= 2) {
			var otherChannel = config[arguments[1]];
			if (otherChannel) {
				channel = otherChannel;
			}
		}

		var result = sendSlackMessage(channel, body);
		return result;
	};

	this.error = function (err, context) {
		var record = arguments[2] ? arguments[2] : "No-Record";
		var body = {};
		var channel = config.ErrorChannel;

		if (arguments[3]) {
			var otherChannel = config[arguments[3]];
			if (otherChannel) {
				channel = otherChannel;
			}
		}

		var d = "";
		if (debug) {
			d = debug.replace(/<br>/g, "\n");
			d = debug.replace(/<BR>/g, "\n");
		}

		var m = "";
		if (message) {
			m = message.replace(/<br>/g, "\n");
			m = message.replace(/<BR>/g, "\n");
		}

		var head = "<!here> #Error *!!!!ERROR!!!!* from " + aa.getServiceProviderCode() + "'s " + config.Environment + " environment.\n";
		var msg = "_______________________________________________________\n";
		msg += "## Event- " + controlString + "\n\n### Record- " + record + "\n\n### Canceled?- " + cancel + "\n\n#### Context- " + context + "\n\n#### Line- " + err.lineNumber + "\n";
		msg += "_______________________________________________________\n";
		msg += "##### Message\n\n" + err.message + "\n\n##### Stack\n\n" + err.stack + "\n\n#### Message\n\n" + m + "\n\n##### Debug\n\n" + d + "\n\n";
		msg += "_______________________________________________________\n";
		msg += datetime();
		msg += "_______________________________________________________\n";

		body.text = head;
		body.attachments = [{"text": msg}];

		if (arguments[3] == "DEBUG") {
			logDebug(body.text + "\n" + body.attachments[0].text);
		} else if (arguments[3] == "PRINT") {
			aa.print(body.text + "\n" + body.attachments[0].text);
		}else if (channel) {
			var result = sendSlackMessage(channel, body);
			return result;
		} 

		return body.text + "\n" + body.attachments[0].text;
	};

	this.debug = function () {
		var body = {};
		var channel = config.LogChannel;
		var head = "";

		if (arguments.length >= 1) {
			var otherChannel = config[arguments[0]];
			if (otherChannel) {
				channel = otherChannel;
			}
		}

		head = "<!here> #Debug " + aa.getServiceProviderCode() + "::" + config.Environment + "::says- \n";

		var d = false;
		if (debug) {
			d = debug.replace(/<br>/g, "\n");
			d = debug.replace(/<BR>/g, "\n");
		}

		var m = false;
		if (message) {
			m = message.replace(/<br>/g, "\n");
			m = message.replace(/<BR>/g, "\n");
		}

		var msg = "";
		if (d) {
			msg += "_______________________________________________________\n" + "Debug:\n" + d + "\n_______________________________________________________\n";
		}

		if (m) {
			msg += "_______________________________________________________\n" + "Message:\n" + m + "\n_______________________________________________________\n";
		}

		msg + "\n_______________________________________________________" + datetime() + "\n_______________________________________________________\n";

		body.text = head;
		body.attachments = [{"text": msg}];

		if (arguments[0] == "DEBUG") {
			logDebug(body.text + "\n" + body.attachments[0].text);
		} else if (arguments[0] == "PRINT") {
			aa.print(body.text + "\n" + body.attachments[0].text);
		}else if (channel) {
			var result = sendSlackMessage(channel, body);
			return result;
		}

		return body.text + "\n" + body.attachments[0].text;
	};

	this.explore = function (object) {
		var body = {};
		var channel = config.LogChannel;

		if (arguments[1]) {
			var otherChannel = config[arguments[1]];
			if (otherChannel) {
				channel = otherChannel;
			}
		}

		var head = "<!here> #Explore This is a description of **" + object + "** from " + aa.getServiceProviderCode() + "'s " + config.Environment + " environment.\n";
		var msg = "_______________________________________________________\n";
		msg += "## Methods- \n";

		for (var x in object) {
			if (typeof object[x] == "function") {
				msg += "### " + x + " \n";
			}
		}

		msg += "## Properties- \n";

		for (var i in object) {
			if (typeof object[i] != "function") {
				msg += "### " + i + " = " + object[i] + " \n";
			}
		}

		msg += "_______________________________________________________\n";
		msg += datetime();
		msg += "_______________________________________________________\n";

		body.text = head;
		body.attachments = [{"text": msg}];

		if (arguments[1] == "DEBUG") {
			logDebug(body.text + "\n" + body.attachments[0].text);
		} else if (arguments[1] == "PRINT") {
			aa.print(body.text + "\n" + body.attachments[0].text);
		}else if (channel) {
			var result = sendSlackMessage(channel, body);
			return result;
		}

		return body.text + "\n" + body.attachments[0].text;
	};

	this.emailDebug = function () {
		//TODO : Function needs testing
		var pToEmail = config.sendTo;
		if (arguments.length == 3) {
			var otherEmail = config["email-" + arguments[2]];
			if (otherEmail) {
				pToEmail = otherEmail;
			}
		}

		var d = false;
		if (debug) {
			d = debug.replace(/<br>/g, "\n");
			d = debug.replace(/<BR>/g, "\n");
		}

		var m = false;
		if (message) {
			m = message.replace(/<br>/g, "\n");
			m = message.replace(/<BR>/g, "\n");
		}

		var msg = "";
		if (d) {
			msg += "_______________________________________________________\n" + "Debug:\n" + d + "\n_______________________________________________________\n";
		}

		if (m) {
			msg += "_______________________________________________________\n" + "Message:\n" + m + "\n_______________________________________________________\n";
		}

		if (d || m) {
			msg + "\n_______________________________________________________" + datetime() + "\n_______________________________________________________\n";
		}

		if (pToEmail) {
			aa.sendMail("auto-sender@accela.com", pToEmail, "", aa.getServiceProviderCode() + "::" + config.Environment + "::" + datetime() + "#Debug says- ", msg);
		}

		return aa.getServiceProviderCode() + "::" + config.Environment + "::" + datetime() + "#Debug says- \n" + msg;
	};

	this.emailExplore = function (object) {
		//TODO : Function needs testing
		var context = "";
		var pToEmail = config.sendTo;
		if (arguments.length == 3) {
			var otherEmail = config["email-" + arguments[2]];
			if (otherEmail) {
				pToEmail = otherEmail;
			}
		}

		if (arguments.length >= 2) context = arguments[1];

		var msg = "<!here> # This is a description of **" + object + "** from " + aa.getServiceProviderCode() + "'s " + config.Environment + " environment.\n";
		msg += "_______________________________________________________\n";
		msg += "## Methods- \n";

		for (var x in object) {
			if (typeof object[x] == "function") {
				msg += "### " + x + " \n";
			}
		}

		msg += "## Properties- \n";

		for (var i in object) {
			if (typeof object[i] != "function") {
				msg += "### " + i + " = " + object[i] + " \n";
			}
		}

		msg += "_______________________________________________________\n";
		msg += datetime();
		msg += "_______________________________________________________\n";

		if (pToEmail) {
			aa.sendMail("auto-sender@accela.com", pToEmail, "", aa.getServiceProviderCode() + "::" + config.Environment + "::" + context + "::" + datetime() + " #Explore says- ", msg);
		}

		return aa.getServiceProviderCode() + "::" + config.Environment + "::" + context + "::" + datetime() + " #Explore says- \n" + msg;
	};

	this.emailLog = function (text) {
		var context = "";
		var pToEmail = config.sendTo;
		if (arguments.length == 3) {
			var otherEmail = config["email-" + arguments[2]];
			if (otherEmail) {
				pToEmail = otherEmail;
			}
		}

		if (arguments.length >= 2) context = arguments[1];

		if (pToEmail) {
			aa.sendMail("auto-sender@accela.com", pToEmail, "", aa.getServiceProviderCode() + "::" + config.Environment + "::" + context + "::" + datetime() + " #Log says- ", text);
		}

		return aa.getServiceProviderCode() + "::" + config.Environment + "::" + context + "::" + datetime() + " #Log says- \n" + text;
	};

	this.errorEmail = function (capId, err, context) {
		//TODO added message needs testing
		if (getScriptText("SEND_ERROR_EMAIL")) {
			aa.env.setValue("altID", capId.getCustomID());
			aa.env.setValue("environment", config.Environment);
			aa.env.setValue("message", err.message);
			aa.env.setValue("agency", aa.serviceProviderCode);
			aa.env.setValue("context", context);
			aa.env.setValue("controlString", controlString);
			aa.env.setValue("cancel", cancel);
			aa.env.setValue("line", err.lineNumber);
			aa.env.setValue("stack", err.stack);
			aa.env.setValue("debug", debug);
			aa.env.setValue("msg", message);
			aa.env.setValue("capId", capId);

			aa.runScriptInNewTransaction("SEND_ERROR_EMAIL");
		}

		return "#**ERROR**\n" + err.message + "\n" + err.lineNumber + "\n" + err.stack;
	};

	return this;
}
var am = new AgencyMonitor();
