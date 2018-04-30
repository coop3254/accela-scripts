
showDebug=3;

if (wfTask == "Application Acceptance" && wfStatus == "Accepted - Plan Review Req") {
	scheduleInspection("Site Visit", 5);
}

if (wfTask == "Inspection" && wfStatus == "Failed Inspection") {
	logDebug("working");
	addFee("PMT_060FAIL", "PMT_GENERAL", "FINAL", 1, "Y");
}