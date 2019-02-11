if (appMatch('Enforcement/Incident/Abatement/Abandoned Vehicle')) {
	addFee("ENF-20", "ENF_GENERAL", "FINAL", 1, "Y");
}

if (appMatch('Enforcement/Incident/Abatement/Weeds')) {
	addFee("ENF-30", "ENF_GENERAL", "FINAL", 1, "Y");
}

if((appMatch('Enforcement/*/*/*')) {
	addFee("ENF-20", "ENF_GENERAL", "FINAL", 1, "Y");
	showMessage = true; 
  	showDebug = true;
	logDebug(pcs);
}
