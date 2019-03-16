if (appMatch('Enforcement/Zoning/Case/Case') && wfTask == "Collections" && wfStatus == "Civil Penalty Issued") {
	addFee("C_R_ENF_10", "ENF_ZONING", "FINAL", 1, "Y");
}