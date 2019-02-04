if (inspType == 'Annual Fire Safety Inspection' && inspResult == 'Fail Inspection') {
	scheduleInspection('Annual Fire Safety Reinspection', 5);
	addFee("BLDGGEN05", "BLDG_GENERAL", "FINAL", 1, "Y");
}
