if (appMatch('Permits/Residential/New/NA') && wfTask == "Permit Issuance" && wfStatus == "Issued") {
	addFee("PMT_ISS_FEE", "PMT_GENERAL", "FINAL", 1, "Y");
}

if (wfTask == "Application Acceptance" && wfStatus == "Accepted - Plan Review Req") {
	scheduleInspection("Site Visit", 5);
}

if (wfTask == "Inspection" && wfStatus == "Failed Inspection") {
	addFee("PMT_060FAIL", "PMT_GENERAL", "FINAL", 1, "Y");
}
/*
if (wfTask == "Permit Issuance" && wfStatus == "Issued") {
	addFee("PMT_001", "PMT_GENERAL", "FINAL", 4, "Y");
	email("mhopkins@accela.com","mhopkins@accela.com","Permit Ready","Your permit has been issued and is ready for pickup.");
}
*/


//if (appMatch('Permits/Commercial/New/NA') && wfTask == "Application Submittal" && wfStatus == "Accepted - Plan Review Req") {
	//activateTask("Fire Review");
	//activateTask("Building Review");
	//closeTask("Plans Distribution", "Routed for Review");
	//closeTask("Application Submittal", "Accepted - Plan Review Req");
	//closeTask("Zoning Review", "Closed");
	//closeTask("Public Works Review", "Closed");
	//closeTask("Mechanical Review", "Closed");
	//closeTask("Electrical Review", "Closed");
	//email("airkulla@accela.com","ccooper@accela.com","Fire Review Ready","Please perform the necessary tasks on the Fire Review process.");
//}