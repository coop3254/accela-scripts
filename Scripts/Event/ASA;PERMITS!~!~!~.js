if (appMatch('Permits/Commercial/New/NA') && AInfo["Total Floor Area"] != null) {
  addFee("PMT_070", "PMT_GENERAL", "FINAL", AInfo["Total Floor Area"], "Y");
}