if (parcelConditionExistsASB("Building Permit")) {
	cancel = true;
	showMessage = true;
	comment('<font color=red><b>Their is a a condition on this parcel that will not allow a permit to be submitted.</b></font>');
}
