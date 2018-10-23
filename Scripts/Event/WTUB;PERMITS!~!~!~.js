if (wfTask == "Permit Issuance" && wfStatus == "Issued" && parcelConditionExistsASB("Building Permit")) {
	cancel = true;
	showMessage = true;
	comment('<font color=red><b>There is a condition on this parcel that will not allow a permit to be issued.</b></font>');
}
