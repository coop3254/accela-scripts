if (inspType == 'Annual Apartment Inspection' && inspResult == 'Fail Inspection') {
	closeTask('Annual Inspection', 'Failed Inspection', '', '');
	activateTask('Reinspection 30 Days');
	scheduleInspection('Annual Apartment Inspection', 30, 'ADMIN');
	emailContact("Inspection Results", "Your inspection " + inspType + " has failed.", "Applicant");
}

if (inspType == 'Annual Apartment Inspection' && inspResult == 'Fail ReInspection') {
	closeTask('Reinspection 30 Days', 'Failed Reinspection', '', '');
	activateTask('Violation Inspection 15 Days');
	scheduleInspection('Annual Apartment Inspection', 15, 'ADMIN');
	addFee("PMT_060FAIL", "PMT_GENERAL", "FINAL", 1, "Y");
	emailContact("Inspection Results", "Your inspection " + inspType + " has failed the re-inspection.", "Applicant");
}

if (inspType == 'Annual Apartment Inspection' && inspResult == 'Fail 2nd Reinspection') {
	closeTask('Violation Inspection 15 Days', 'Failed Violation Inspection', '', '');
	activateTask('City Attorney');
	emailContact("Inspection Results", "Your inspection " + inspType + " has failed the second re-inspection.", "Applicant");
}

if (inspType == 'Annual Apartment Inspection' && inspResult == 'Pass') {
	closeTask('Annual Inspection', 'Passed');
	activateTask('Final Review');
	emailContact("Inspection Results", "Your inspection " + inspType + " has passed.", "Applicant");
}