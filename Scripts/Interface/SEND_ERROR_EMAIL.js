var capId = aa.env.getValue("capId");
var showDebug = true;
var debug = "";
var br = "<BR>";
var now = new Date();
var datetime = [now.getMonth() + 1, now.getDate(), now.getFullYear()].join("/") + ":" + [now.getHours(), now.getMinutes(), now.getSeconds()].join(":");

var eParams = aa.util.newHashtable();
addParameter(eParams, "$$altID$$", aa.env.getValue("altID"));
addParameter(eParams, "$$Environment$$", aa.env.getValue("environment"));
addParameter(eParams, "$$message$$", aa.env.getValue("message"));
addParameter(eParams, "$$Agency$$", aa.env.getValue("agency"));
addParameter(eParams, "$$Context$$", aa.env.getValue("context"));
addParameter(eParams, "$$ControlString$$", aa.env.getValue("controlString"));
addParameter(eParams, "$$cancel$$", aa.env.getValue("cancel"));
addParameter(eParams, "$$line$$", aa.env.getValue("line"));
addParameter(eParams, "$$stack$$", aa.env.getValue("stack"));
addParameter(eParams, "$$debug$$", aa.env.getValue("debug"));
//TODO added message needs testing
addParameter(eParams, "$$msg$$", aa.env.getValue("msg"));
addParameter(eParams, "$$datetime$$", datetime);

sendNotification("auto-sender@accela.com", lookup("EventExceptionLog", "sendTo"), "", "EVENTEXCEPTIONLOG", eParams, [], capId);

function sendNotification(emailFrom, emailTo, emailCC, templateName, params, reportFile) {
	var itemCap = capId;
	if (arguments.length == 7) itemCap = arguments[6]; // use cap ID specified in args

	var id1 = itemCap.ID1;
	var id2 = itemCap.ID2;
	var id3 = itemCap.ID3;

	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);

	var result = null;
	result = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, emailCC, templateName, params, capIDScriptModel, reportFile);
	if (result.getSuccess()) {
		aa.print("Sent email successfully!");
		return true;
	} else {
		aa.print("Failed to send mail. - " + result.getErrorType());
		return false;
	}
}

function addParameter(parameters, key, value) {
	if (key != null) {
		if (value == null) {
			value = "";
		}
		parameters.put(key, value);
	}
}

function lookup(stdChoice, stdValue) {
	var strControl;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);

	if (bizDomScriptResult.getSuccess()) {
		var bizDomScriptObj = bizDomScriptResult.getOutput();
		strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
		logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
	} else {
		logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
	}
	return strControl;
}

function logDebug(dstr) {
	var vLevel = 1;
	if (arguments.length > 1) vLevel = arguments[1];
	if ((showDebug & vLevel) == vLevel || vLevel == 1) debug += dstr + br;
	if ((showDebug & vLevel) == vLevel) aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr);
}
