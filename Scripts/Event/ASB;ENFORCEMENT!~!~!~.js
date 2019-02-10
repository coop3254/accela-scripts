if (parcelConditionExistsASB("Flood Zone")) {
	addFee("ENF-40", "ENF_GENERAL", "FINAL", 1, "Y");
	comment('<font color=red><b>There is a condition on this parcel that will cause a violation fee to be assessed.</b></font>');
}