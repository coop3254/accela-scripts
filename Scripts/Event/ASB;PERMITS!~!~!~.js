if (parcelConditionExistsASB("Building Permit")) {
	cancel = true;
	showMessage = true;
	comment('<font color=red><b>There is a condition on this parcel that will not allow a permit to be submitted.</b></font>');
}
