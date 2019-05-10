if (appMatch('Permits/Commercial/New/NA') && AInfo["Total Floor Area"] != null) {
  addFee("PMT_070", "PMT_GENERAL", "FINAL", AInfo["Total Floor Area"], "Y");
}

var isCreatedByACA = cap.isCreatedByACA();

if (isCreatedByACA && appMatch('Permits/Residential/Re-Roof/NA')) {
	updateAppStatus('Issued', "Permit Issued via ACA");
	closeTask('Application Submittal', 'Accepted');
	updateTask('Case Closed', 'Issued');
}