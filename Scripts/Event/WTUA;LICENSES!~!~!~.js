if (wfTask == "License Issuance" && wfStatus == "Issued") {
logDebug("Creating child record!");
createChild("Licenses","Teaching Certificate","Initial","License","Teaching Initial Certificate License");
}