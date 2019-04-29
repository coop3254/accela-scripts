if (wfTask == "Rezoning Final" && wfStatus == "Approved") {
logDebug("Creating child records!");
createChild("Permits","Grading","NA","NA", editAppName(appTypeAlias));
createChild("Permits","Public Works","Encroachment","Permit", editAppName(appTypeAlias));
createChild("Permits","Commercial","New","NA", editAppName(appTypeAlias));
createChild("Permits","Commercial","Electrical","NA", editAppName(appTypeAlias));
createChild("Permits","Fire","Suppression","Wet", editAppName(appTypeAlias));
copyAppSpecific(capId);
}
