if (inspType == 'Annual Fire Occupancy' && inspResult == 'Fail Inspection') {
	closeTask('Annual Inspection', 'Failed Inspection', '', '');
	activateTask('Reinspection 30 Days');
	scheduleInspection('Fire Occupancy Reinspection', 30);
	email('mhopkins@accela.com', 'mhopkins@accela.com', 'Failed Inspection Notice', 'This is an update to notify you on your failed inspection.');
}

if (inspType == 'Fire Occupancy Reinspection' && inspResult == 'Fail Re-Inspection') {
	closeTask('Reinspection 30 Days', 'Failed Reinspection', '', '');
	activateTask('Violation Inspection 15 Days');
	scheduleInspection('Fire Occupancy Violation Reinspection', 15);
	email('mhopkins@accela.com', 'mhopkins@accela.com', 'Failed Inspection Notice', 'This is an update to notify you on your failed inspection.');


}

if (inspType == 'Fire Occupancy Violation Reinspection' && inspResult == 'Fail 2nd Reinspection') {
	closeTask('Violation Inspection 15 Days', 'Failed Violation Inspection', '', '');
	activateTask('City Attorney');
	email('mhopkins@accela.com', 'mhopkins@accela.com', 'Failed Inspection Notice', 'This is an update to notify you on your failed inspection.');

}

if (inspType == 'Annual Fire Occupancy' && inspResult == 'Pass') {
	closeTask('Annual Inspection', 'Passed');
	activateTask('Final Review');
}