if (wfTask == "City Council Ratify" && wfStatus == "Approved") {
logDebug("Creating child records!");
createChild("Permits","Grading","NA","NA");
createChild("Permits","Public Works","Encroachment","Permit");
createChild("Permits","Commercial","New","NA");
}