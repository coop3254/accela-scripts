function handleError(err, context) {
	var rollBack = true;
	var showError = true;

	var aMon = new AgencyMonitor();

	if (showError) showDebug = true;
	logDebug((rollBack ? "**ERROR** " : "ERROR: ") + err.message + " In " + context + " Line " + err.lineNumber);
	logDebug("Stack: " + err.stack);

	if (aMon) {  
		//for error slack
		if (lookup("EventExceptionLog", "ErrorChannel")) {
			aMon.error(err, context, capId);
		}
	}
}
