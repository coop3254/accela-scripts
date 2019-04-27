if (wfTask == "Rezoning Final" && wfStatus == "Approved") {
logDebug("Creating child records!");
createChild("Permits","Grading","NA","NA","Grading Permit");
createChild("Permits","Public Works","Encroachment","Permit","Encroachment Permit");
createChild("Permits","Commercial","New","NA","Commercial New Building Permit");
createChild("Permits","Commercial","Electrical","NA","Commercial Electrical Permit");
createChild("Permits","Fire","Suppression","Wet","Fire Suppression Permit");
}