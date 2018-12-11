if (inspType == 'Annual Apartment Inspection' && inspResult == 'Fail Inspection') {
	//closeTask('Annual Inspection', 'Failed Inspection', '', '');
	//activateTask('Reinspection 30 Days');
	scheduleInspection('Annual Apartment Reinspection', 30, 'ADMIN');
	//sendInspectionResultGuidesheetReport();
}

if (inspType == 'Annual Apartment Reinspection' && inspResult == 'Fail ReInspection') {
	//closeTask('Reinspection 30 Days', 'Failed Reinspection', '', '');
	//activateTask('Violation Inspection 15 Days');
	scheduleInspection('Annual Apartment Reinspection', 15, 'ADMIN');
	//addFee("PMT_060FAIL", "PMT_GENERAL", "FINAL", 1, "Y");
	//sendInspectionResultGuidesheetReport();
}

if (inspType == 'Annual Apartment Inspection' && inspResult == 'Fail 2nd Reinspection') {
	//closeTask('Violation Inspection 15 Days', 'Failed Violation Inspection', '', '');
	//activateTask('City Attorney');
	//sendInspectionResultGuidesheetReport();
}

if (inspType == 'Annual Apartment Inspection' && inspResult == 'Pass') {
	closeTask('Annual Inspection', 'Passed');
	activateTask('Final Review');
}