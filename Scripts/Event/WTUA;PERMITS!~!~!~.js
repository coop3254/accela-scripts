
showDebug=3;

if (wfTask == "Application Acceptance" && wfStatus == "Accepted - Plan Review Req") {
	scheduleInspection("Site Visit", 5);
}

if (wfTask == "Inspection" && wfStatus == "Failed Inspection") {
	invoiceFee("PMT_060FAIL", "FINAL");
}