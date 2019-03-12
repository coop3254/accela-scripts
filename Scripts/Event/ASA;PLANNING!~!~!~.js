if (AInfo["Conditional Use Permit"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","Conditional Use","NA","NA","Planning Conditional Use");
}

if (AInfo["Environmental Assessment"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","Property Dedication","NA","NA","Environmental Assessment");
}

if (AInfo["Lot Line Adjustment"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","Lot Line Adjustment","NA","NA","Lot Line Adjustment");
}

if (AInfo["Administrative Adjustments"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","Administrative Deviations","NA","NA","Administrative Adjustments");
}

if (AInfo["General Plan Amendment"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","General Plan","Amendment","NA","General Plan Amendment");
}

if (AInfo["Specific Plan"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","General Plan","Amendment","NA","Specific Plan");
}

if (AInfo["Subdivision"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","Subdivision","Final","NA","Subdivision");
}

if (AInfo["Variance"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","Variance","NA","NA","Variance");
}

if (AInfo["Zone Text Amendment"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","Rezoning","NA","NA","Zone Text Amendment");
}

if (AInfo["Zone Change"] == "CHECKED") {
logDebug("Creating child record!");
createChild("Planning","Rezoning","NA","NA","Zone Change");
}

