if (wfTask == "Administrative Review" && wfStatus == "Ready for Annual Inspection") {
	scheduleInspection("Annual Fire Safety Inspection", 365);
	addFee("BLDGGEN07", "BLDG_GENERAL", "FINAL", 1, "Y");
}
