if (appMatch('Licenses/Business/General/Application') && AInfo["Business Type"] == "Restaurant Diner or Coffee Shop") {
	createChild("Licenses","Business","Restaurant","Application","Restaurant Business License Application")
}

if (appMatch('Licenses/Business/General/Application') && AInfo["Business Engagement"] == "Make renovations or alterations to an existing building") {
	createChild("Building","Commercial","Alteration","NA","Commercial Alteration Permit")
}