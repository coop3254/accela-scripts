
if (wfTask == "Application Acceptance" && wfStatus == "Accepted - Plan Review Req") {
	scheduleInspection("Site Visit", 5);
}

if (wfTask == "Inspection" && wfStatus == "Failed Inspection") {
	addFee("PMT_060FAIL", "PMT_GENERAL", "FINAL", 1, "Y");
}

if (wfTask == "Permit Issuance" && wfStatus == "Issued") {
	addFee("PMT_001", "PMT_GENERAL", "FINAL", 4, "Y");
}
