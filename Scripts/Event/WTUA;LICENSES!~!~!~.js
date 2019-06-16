if (wfTask == "License Issuance" && wfStatus == "Issued") {
logDebug("Creating child record!");
createChild("Licenses","Teaching Certificate","Initial","License","Teaching Initial Certificate License");
}

if (appMatch('Licenses/Engineers & Architects/Engineer/Application') && wfTask == "Issuance" && wfStatus == "Issued") {
	createChild("Licenses","Engineers & Architects","Engineer","License","Engineer License")
}