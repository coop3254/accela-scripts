if (appMatch('Licenses/Business/General/Renewal')) {
	editAppSpecific("Total Tax Due", sumASITColumn("LIC_TAX", "AMOUNT DUE"));
}


