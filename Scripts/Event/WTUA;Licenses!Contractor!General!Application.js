//Last part of Script #106, Commercial and Residential are added via configurable script

if(appMatch("Licenses/Contractor/General/Application")){
	var contType = getAppSpecific("Contractor Type");
	if(wfTask == "License Issuance" && wfStatus == "Ready to Pay"){
		if (!matches(contType, "Commercial Building", "Residential Building"){
			updateFee("LIC_020", "LIC_CONTRACTOR_GENERAL", "FINAL", 1, "Y");
		}
	}
}