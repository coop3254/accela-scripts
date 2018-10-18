if (wfTask == "City Council Ratify" && wfStatus == "Approved") {
logDebug("Creating child records!");
createChild("Permits","Grading","NA","NA","Grading Permit");
createChild("Permits","Public Works","Encroachment","Permit","Encroachment Permit");
createChild("Permits","Commercial","New","NA","Commercial New Building Permit");
}
