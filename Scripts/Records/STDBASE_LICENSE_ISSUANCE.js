/*==========================================================================================
Title : STDBASE_LICENSE_ISSUANCE
Purpose : Creates license record, LPs, expiration dates and relationships
Author: David Bischof
Functional Area : 
Description : JSON must contain :
{
  "Marijuana/Combo/Testing Facility/Application": {                        
    "WorkflowTaskUpdateAfter": [                                     
      {
        "preScript": "",                                               
        "metadata": {                                                  
          "description": "License Issuance",
          "operators": {
            
          }
        },
        "criteria": {
          "task": [
            "License Status"
          ],
          "status": [
            "Active"
          ]
        },
        "action": {
          "parentLicense": "Marijuana/Combo/Testing Facility/License",
          "issuedStatus": "Issued",
          "copyCustomFields": [
            "ALL"
          ],
          "copyCustomTables": [
            "ALL"
          ],
          "copyEducation": false,
          "copyContinuingEducation": false,
          "copyExamination": false,
          "copyContacts": [
			  "ALL"
			],
          "expirationType": "Days",    /// this accept Expiration Code or Days or Function
          "originationDate": "",    //Options: 'File Date' , 'Issued Date'
          "customExpirationFunction": "", // if the expiration type is function then this will be the funciton name,
          "expirationPeriod": "30",
          "refLPType": "Architect",
          "contactType": "Employee",
          "contactAddressType": "Mailing", // Use contact address types otherwise use single contact address
          "createLP": true,
          "licenseTable": "HATEST",
          "childLicense": "Marijuana/Combo/Testing Facility/License",
          "recordIdField": "TEST haetham"
        },
        "postScript": ""
      }
    ]
  }
}
Notes:
- originationDate:
-- 'File Date' : file date of child record
-- 'Issued Date' : action date (now)
- parentLicense and childLicense Json properties supports wildcard:
the "*" character will be replaced with corresponding value from current record type.
Reviewed By: 
Script Type : (EMSE, EB, Pageflow, Batch): EMSE
General Purpose/Client Specific : General
Client developed for : Louisville
Parameters:
				itemCap - capIdObject
				recordSettings - JSON rule
				
				
update by :  Haetham Eleisah handle custom expiration function to calculate the license expiration date.
================================================================================================================*/
//CONSTANTS
var TO_PARENT = 1;
var FROM_PARENT = 2;
var TO_CHILD = 3;
var USAGE_TYPES = new Array();
USAGE_TYPES["copyfromparent"] = FROM_PARENT;
USAGE_TYPES["copytoparent"] = TO_PARENT;
USAGE_TYPES["copytochild"] = TO_CHILD;

var scriptSuffix = "LICENSE_ISSUANCE";
// CONF_{SOLUTION}_LICENSE_ISSUANCE
// {SOLUTION} = AS DEFINED IN THE "SOLUTION MAPPING" STANDARD CHOICE

try {
	// This should be included in all Configurable Scripts
	eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));

	var settingsArray = [];
	if (isConfigurableScript(settingsArray, scriptSuffix)) {
		for (s in settingsArray) {

			var rules = settingsArray[s];
			logDebug("rules: " + rules);

			//Execute PreScript
			var preScript = rules.preScript;
			if (!isEmptyOrNull(preScript)) {
				eval(getScriptText(preScript, null, false));
			}
			if (cancelCfgExecution) {
				logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
				cancelCfgExecution = false;
				continue;
			}
			//Execute licenseIssuance
			licenseIssuance(capId, rules.action);

			// / run post script
			var postScript = rules.postScript;
			if (!isEmptyOrNull(postScript)) {
				eval(getScriptText(postScript, null, false));
			}
		}
	}

} catch (ex) {
	logDebug("**ERROR:Exception while verifying the rules for " + scriptSuffix + ". Error: " + ex);
}

/**
 * Standard base script for License Issuance
 * 
 * @param {CapIdObject} itemCapId 
 * @param {Array} recordSettings
 */
function licenseIssuance(itemCapId, recordSettings) {
	var functionTitle = "licenseIssuance()";
	var debugMode = true;
	// validate JSON parameters using handleUndefined function blah
	// handleUndefine(JSON Parameter, isRequired);
	var rParentLicense = handleUndefined(recordSettings.parentLicense, false);
	var rIssuedStatus = handleUndefined(recordSettings.issuedStatus, false);
	var rLicTable = handleUndefined(recordSettings.licenseTable, false);
	var rCustomExpirationFunction = handleUndefined(recordSettings.customExpirationFunction, false);
	var rHasParent, rLicAppArray, rNewLicId, rNewLicIdString, rVehData, rChildVehId, rC1ExpResult, rB1Model;
	var capIdsArray = new Array();
	var usageType = TO_PARENT;

	if (rParentLicense != "") {
		rHasParent = true;
		rLicAppArray = rParentLicense.trim().split("/");

		rLicAppArray = prepareAppTypeArray(rLicAppArray);

		//anything went wrong in prepareAppTypeArray()
		if (!rLicAppArray) {
			return false;
		}

		//create license
		rNewLicId = createParentLocal(rLicAppArray[0], rLicAppArray[1], rLicAppArray[2], rLicAppArray[3], null);

		if (!rNewLicId) {
			logDebug("**WARN Failed to createParent() of type:" + rParentLicense);
			return false;
		}

		//call ASA of new record
		var newCap = aa.cap.getCap(rNewLicId).getOutput();

		capIdsArray.push(rNewLicId);

		rNewLicIdString = rNewLicId.getCustomID();

		if (rIssuedStatus != null && rIssuedStatus != "") {
			updateAppStatus(rIssuedStatus, "", rNewLicId);
		}
		if (!isEmptyOrNull(recordSettings.copyCustomFields)) {
			copyAppSpecificLocal(capIdsArray, recordSettings.copyCustomFields, usageType);
		}

		if (!isEmptyOrNull(recordSettings.copyCustomTables)) {
			copyAppSpecificTableLocal(capIdsArray, rules.action.copyCustomTables, usageType);
		}
		if (recordSettings.copyEducation)
			aa.education.copyEducationList(itemCapId, rNewLicId);

		if (recordSettings.copyContinuingEducation)
			aa.continuingEducation.copyContEducationList(itemCapId, rNewLicId);

		if (recordSettings.copyExamination)
			aa.examination.copyExaminationList(itemCapId, rNewLicId);

		if (!isEmptyOrNull(recordSettings.copyContacts)) {
			copyContactsLocal(capIdsArray, recordSettings.copyContacts, usageType);
		}

		//handle Expiration	
		rB1ExpResult = aa.expiration.getLicensesByCapID(rNewLicId).getOutput();
		if (rB1ExpResult != null && rB1ExpResult.getB1Expiration() != null) {
			//Get Next Expiration Date if using Expiration Code
			if (recordSettings.expirationType == "Expiration Code") {
				var rExpBiz = aa.proxyInvoker.newInstance("com.accela.aa.license.expiration.ExpirationBusiness").getOutput();
				rB1Model = rB1ExpResult.getB1Expiration();
				rNextDate = rExpBiz.getNextExpDate(rB1Model);
				rB1ExpResult.setExpDate(aa.date.parseDate(dateAdd(rNextDate, 0)));
			}

			if (recordSettings.expirationType == "Days") {
				var originationDate = recordSettings.originationDate;
				var orgInitDate = aa.util.now();
				if (originationDate != null && originationDate.equalsIgnoreCase("File Date")) {
					var thisCap = aa.cap.getCap(capId).getOutput();
					orgInitDate = aa.util.formatDate(thisCap.getCapModel().getFileDate(), "MM/dd/yyyy");
				} else if (originationDate != null && originationDate.equalsIgnoreCase("Issued Date")) {
					orgInitDate = aa.util.now();
				} else {
					logDebug("**WARN originationDate type not supported " + originationDate + " used now() init value");
				}

				rB1ExpResult.setExpDate(aa.date.parseDate(dateAdd(orgInitDate, recordSettings.expirationPeriod)));
			}
			if (recordSettings.expirationType == "Function" && rCustomExpirationFunction != null && rCustomExpirationFunction != "") {
				var dateCalculationFuntion = rCustomExpirationFunction + "( rB1ExpResult )";
				var dateResult = eval("(" + dateCalculationFuntion + ")");
				if (dateResult instanceof Date) {
					rB1ExpResult.setExpDate(aa.date.parseDate(dateAdd(dateResult, 0)));
				} else {
					logDebug("WARNING: Custom Function returned values does not accepted as date");
				}

			}

			if (!isEmptyOrNull(rIssuedStatus))
				rB1ExpResult.setExpStatus(rIssuedStatus);

			aa.expiration.editB1Expiration(rB1ExpResult.getB1Expiration());
		} else {
			logDebug("**WARN rB1ExpResult is null for created Parent License " + rNewLicId);
		}

		aa.cap.runEMSEScriptAfterApplicationSubmit(newCap.getCapModel(), rNewLicId);
	}

	if (recordSettings.createLP) {
		//create LP
		var contactAddressType = handleUndefined(recordSettings.contactAddressType, false);
		if (contactAddressType == "") {
			contactAddressType = null;
		}
		createRefLP4Lookup(rNewLicIdString, recordSettings.refLPType, recordSettings.contactType, contactAddressType);

		//Set Business Name and Exp Date
		rNewLP = aa.licenseScript.getRefLicensesProfByLicNbr(aa.serviceProvider, rNewLicIdString).getOutput();
		if (rNewLP) {
			rThisLP = rNewLP[0];
			rThisLP.setLicenseIssueDate(aa.date.parseDate(dateAdd(aa.util.now(), 0)));

			if (rHasParent && recordSettings.expirationType == "Expiration Code") {
				rThisLP.setLicenseExpirationDate(aa.date.parseDate(dateAdd(rNextDate, 0)));
			}

			if (!rHasParent && recordSettings.expirationType == "Expiration Code") {
				rB1ExpResult = aa.expiration.getLicensesByCapID(itemCapId).getOutput();
				if (rB1ExpResult != null && rB1ExpResult.getB1Expiration() != null) {
					var rExpBiz = aa.proxyInvoker.newInstance("com.accela.aa.license.expiration.ExpirationBusiness").getOutput();
					rB1Model = rB1ExpResult.getB1Expiration();

					rNextDate = rExpBiz.getNextExpDate(rB1Model);
					rB1ExpResult.setExpDate(aa.date.parseDate(dateAdd(rNextDate, 0)));
					aa.expiration.editB1Expiration(rB1ExpResult.getB1Expiration());
					rThisLP.setLicenseExpirationDate(aa.date.parseDate(dateAdd(rNextDate, 0)));
				} else {
					logDebug("**WARN rB1ExpResult is null for record with CapId=" + itemCapId);
				}
			}

			if (recordSettings.expirationType == "Days") {

				var originationDate = recordSettings.originationDate;
				var orgInitDate = aa.util.now();
				if (originationDate != null && originationDate.equalsIgnoreCase("File Date")) {
					var thisCap = aa.cap.getCap(capId).getOutput();
					orgInitDate = aa.util.formatDate(thisCap.getCapModel().getFileDate(), "MM/dd/yyyy");
				} else if (originationDate != null && originationDate.equalsIgnoreCase("Issued Date")) {
					orgInitDate = aa.util.now();
				} else {
					logDebug("**WARN originationDate type not supported " + originationDate + " used now() init value");
				}

				rThisLP.setLicenseExpirationDate(aa.date.parseDate(dateAdd(orgInitDate, recordSettings.expirationPeriod)));
			}
			if (recordSettings.expirationType == "Function" && rCustomExpirationFunction != null && rCustomExpirationFunction != "") {
				var dateCalculationFuntion = rCustomExpirationFunction + "( rNewLP )";
				var dateResult = eval("(" + dateCalculationFuntion + ")");

				if (dateResult instanceof Date) {
					rThisLP.setLicenseExpirationDate(aa.date.parseDate(dateAdd(dateResult, 0)));
				}
			}
			var editRefResult = aa.licenseScript.editRefLicenseProf(rThisLP);
			if (rHasParent) {
				aa.licenseScript.associateLpWithCap(rNewLicId, rThisLP);
			}

			if (!isEmptyOrNull(rNewLicIdString)) {
				//check if public user exist for the contact type:
				var reqContact = null;
				var contactsList = getContacts();
				if (contactsList && contactsList.length > 0) {

					for (c in contactsList) {
						if (String(contactsList[c]["contactType"]).equalsIgnoreCase(String(recordSettings.contactType))) {
							reqContact = contactsList[c];
							break;
						}
					}//for all cap contacts
				}//cap has contacts
				if (reqContact != null && reqContact["email"] != null && reqContact["email"] != "") {
					var thisPublicUser = getOrCreatePublicUser(reqContact["email"], reqContact["contactSeqNumber"]);
					if (thisPublicUser != null) {
						var publicUserSeqNum = thisPublicUser.getUserSeqNum();
						if (!isLicenseConnectedToPublicUser(publicUserSeqNum, rNewLicIdString)) {
							associateLPToPublicUser(rNewLicIdString, publicUserSeqNum);
						}//user not assoc with LP
					}//thisPublicUser
				}//contact has email
			}//rNewLicIdString is OK
		}//get created LP success (ref LP)
	}

	//Handle Tabular Licensing
	if (recordSettings.licenseTable != "") {
		var ASITRowsArray = [];
		rLicChildArray = recordSettings.childLicense.split("/");

		rLicChildArray = prepareAppTypeArray(rLicChildArray);

		//anything went wrong in prepareAppTypeArray()
		if (rLicChildArray) {
			rLicTable = loadASITable(recordSettings.licenseTable);
			for (x in rLicTable) {
				rVehData = rLicTable[x];
				if (rHasParent) {
					rChildVehId = createChild(rLicChildArray[0], rLicChildArray[1], rLicChildArray[2], rLicChildArray[3], null, rNewLicId);
				} else {
					rChildVehId = createChild(rLicChildArray[0], rLicChildArray[1], rLicChildArray[2], rLicChildArray[3], null, itemCapId);
				}
				if (rIssuedStatus != null && rIssuedStatus != "")
					updateAppStatus(rIssuedStatus, "", rChildVehId);

				rC1ExpResult = aa.expiration.getLicensesByCapID(rChildVehId).getOutput();

				if (rC1ExpResult != null && rC1ExpResult.getB1Expiration() != null) {
					//Get Next Expiration Date if using Expiration Code
					if (recordSettings.expirationType == "Expiration Code") {
						var rExpBiz = aa.proxyInvoker.newInstance("com.accela.aa.license.expiration.ExpirationBusiness").getOutput();
						rB1Model = rC1ExpResult.getB1Expiration();

						rNextDate = rExpBiz.getNextExpDate(rB1Model);
						rC1ExpResult.setExpDate(aa.date.parseDate(dateAdd(rNextDate, 0)));
					}

					if (recordSettings.expirationType == "Days") {

						var originationDate = recordSettings.originationDate;
						var orgInitDate = aa.util.now();
						if (originationDate != null && originationDate.equalsIgnoreCase("File Date")) {
							var thisCap = aa.cap.getCap(capId).getOutput();
							orgInitDate = aa.util.formatDate(thisCap.getCapModel().getFileDate(), "MM/dd/yyyy");
						} else if (originationDate != null && originationDate.equalsIgnoreCase("Issued Date")) {
							orgInitDate = aa.util.now();
						} else {
							logDebug("**WARN originationDate type not supported " + originationDate + " used now() init value");
						}

						rC1ExpResult.setExpDate(aa.date.parseDate(dateAdd(orgInitDate, recordSettings.expirationPeriod)));
					}
					if (recordSettings.expirationType == "Function" && rCustomExpirationFunction != null && rCustomExpirationFunction != "") {
						var dateCalculationFuntion = rCustomExpirationFunction + "( rC1ExpResult )";
						var dateResult = eval("(" + dateCalculationFuntion + ")");
						if (dateResult instanceof Date) {
							rC1ExpResult.setExpDate(aa.date.parseDate(dateAdd(dateResult, 0)));
						}
					}

					rC1ExpResult.setExpStatus(rIssuedStatus);
					aa.expiration.editB1Expiration(rC1ExpResult.getB1Expiration());
				} else {
					logDebug("**WARN rC1ExpResult is null for created Child " + rChildVehId);
				}

				var ASITRow = UpdateASITRow(x, recordSettings.recordIdField, rChildVehId.getCustomID());
				ASITRowsArray.push(ASITRow);
				if (recordSettings.createLP && rNewLP != null && rNewLP.length > 0) {
					aa.licenseScript.associateLpWithCap(rChildVehId, rThisLP);
				}
			}

			if (rNewLicId && rNewLicId != null && rNewLicId != "") {
				if (ASITRowsArray.length > 0)
					updateASITColumns(ASITRowsArray, recordSettings.licenseTable);

				//// moved here because  the script update the ASIT on the application and need to copy the updated data to the license.
				if (recordSettings.copyCT)
					copyASITables(itemCapId, rNewLicId);
			}//rNewLicId is OK
		}//rLicChild array OK
	}
}

function createParentLocal(grp, typ, stype, cat, desc)
//
// creates the new application and returns the capID object
// updated by JHS 10/23/12 to use copyContacts that handles addresses
//
{
	var appCreateResult = aa.cap.createApp(grp, typ, stype, cat, desc);
	logDebug("creating cap " + grp + "/" + typ + "/" + stype + "/" + cat);
	if (appCreateResult.getSuccess()) {
		var newId = appCreateResult.getOutput();
		logDebug("cap " + grp + "/" + typ + "/" + stype + "/" + cat + " created successfully ");

		// create Detail Record
		capModel = aa.cap.newCapScriptModel().getOutput();

		capDetailModel = capModel.getCapModel().getCapDetailModel();
		capDetailModel.setCapID(newId);
		aa.cap.createCapDetail(capDetailModel);
		var newObj = aa.cap.getCap(newId).getOutput(); //Cap object
		var result = aa.cap.createAppHierarchy(newId, capId);

		if (result.getSuccess())
			logDebug("Parent application successfully linked");
		else
			logDebug("Could not link applications");

		// Copy Parcels
		var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);

		if (capParcelResult.getSuccess()) {
			var Parcels = capParcelResult.getOutput().toArray();

			for (zz in Parcels) {
				logDebug("adding parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
				var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
				newCapParcel.setParcelModel(Parcels[zz]);
				newCapParcel.setCapIDModel(newId);
				newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
				newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
				aa.parcel.createCapParcel(newCapParcel);
			}

		}

		// Copy Addresses
		capAddressResult = aa.address.getAddressByCapId(capId);
		if (capAddressResult.getSuccess()) {
			Address = capAddressResult.getOutput();
			for (yy in Address) {
				newAddress = Address[yy];
				newAddress.setCapID(newId);
				aa.address.createAddress(newAddress);
				logDebug("added address");
			}
		}

		return newId;
	} else {
		logDebug("**ERROR: adding parent App: " + appCreateResult.getErrorMessage());
	}
}

/**
* Copy Contacts from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
* @param capIdsArray array of Parent or Child CapIdModel
* @param copyTypes ALL or a bar separated values (group names, or types)
* @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
* @returns {Boolean} true if success, false otherwise
*/
function copyContactsLocal(capIdsArray, copyTypes, copyDirection) {
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);
		logDebug("**INFO: copyContactsLocal(): " + capIdsArray[ca] + " usageType: " + copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyContactsLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		var copyTypesArray = getCopyTypesArray(copyTypes);

		//handle ("" means don't copy)
		if (copyTypesArray != null && copyTypesArray.length == 0) {
			return;
		}

		//ACA PageFlow/ FROM_PARENT
		if (controlString.equalsIgnoreCase("Pageflow") && copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');
			copyContactFromParent4ACA(currCapModel, srcDestArray["src"], copyTypesArray);
			//copy from 1st parent only (other will just overwrite)
			return;
		}

		if (copyTypesArray == null) {

			copyContacts(srcDestArray["src"], srcDestArray["dest"]);
		} else {
			for (cd in copyTypesArray) {
				copyContactsByType(srcDestArray["src"], srcDestArray["dest"], copyTypesArray[cd]);
			}
		}

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}

/**
 * Copy ASI from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes all or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAppSpecificLocal(capIdsArray, copyTypes, copyDirection) {
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);
		if (!srcDestArray) {
			logDebug("**INFO: copyAppSpecificLocal(): Invalid usageType: " + copyDirection);
			return false;
		}
		logDebug("**INFO: copyAppSpecificLocal(): copyTypes.length = " + copyTypes.length + " copyTypes[0] = " + copyTypes[0])
		copyTypes = getCopyTypesArray(copyTypes);
		//handle ("" means don't copy)
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}

		//ACA PageFlow/ FROM_PARENT
		if (controlString.equalsIgnoreCase("Pageflow") && copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');
			copyASIFromParent4ACA(currCapModel, srcDestArray["src"], copyTypes);
			//copy from 1st parent only (other will just overwrite)
			return;
		}
		logDebug("Copy App Specific All Source = " + srcDestArray["src"].getCustomID() + " -> Destination = " + srcDestArray["dest"].getCustomID());
		copyAppSpecificByType(srcDestArray["src"], srcDestArray["dest"], copyTypes);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy ASIT from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes all or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAppSpecificTableLocal(capIdsArray, copyTypes, copyDirection) {
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyAppSpecificTableLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		copyTypes = getCopyTypesArray(copyTypes);
		//handle ("" means don't copy)
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}

		//ACA PageFlow/ FROM_PARENT
		if (controlString.equalsIgnoreCase("Pageflow") && copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');
			copyAsitFromParent4ACA(currCapModel, srcDestArray["src"], copyTypes);
			//copy from 1st parent only (other will just overwrite)
			return;
		}

		copyASITablesByType(srcDestArray["src"], srcDestArray["dest"], copyTypes);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
function copyContactFromParent4ACA(currentRecordCapModel, parentCapId, typesArray) {
	contactsGroup = currentRecordCapModel.getContactsGroup();
	if (contactsGroup.size() > 0) {
		return;
	}
	var t = aa.people.getCapContactByCapID(parentCapId);
	if (t.getSuccess()) {
		capPeopleArr = t.getOutput();
		for (cp in capPeopleArr) {
			if (typesArray != null && !arrayContainsValue(typesArray, capPeopleArr[cp].getCapContactModel().getPeople().getContactType())) {
				continue;
			}
			capPeopleArr[cp].getCapContactModel().setCapID(null);
			//contactsGroup.add(capPeopleArr[cp].getCapContactModel());
			contactAddFromUser4ACA(currentRecordCapModel, capPeopleArr[cp].getCapContactModel());
			return;
		} //for all contacts from parent
	} //get paretn contacts success
}

function contactAddFromUser4ACA(capModel, contactModel) {
	var theContact = contactModel.getPeople();
	var capContactModel = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactModel").getOutput();
	capContactModel.setContactType(theContact.getContactType());
	capContactModel.setFirstName(theContact.getFirstName());
	capContactModel.setMiddleName(theContact.getMiddleName());
	capContactModel.setLastName(theContact.getLastName());
	capContactModel.setFullName(theContact.getFullName());
	capContactModel.setEmail(theContact.getEmail());
	capContactModel.setPhone2(theContact.getPhone2());
	capContactModel.setPhone1CountryCode(theContact.getPhone1CountryCode());
	capContactModel.setPhone2CountryCode(theContact.getPhone2CountryCode());
	capContactModel.setPhone3CountryCode(theContact.getPhone3CountryCode());
	capContactModel.setCompactAddress(theContact.getCompactAddress());
	capContactModel.sePreferredChannele(theContact.getPreferredChannel()); // Preferred Channel is used for 'Particiapnt Type' in ePermits. Yes, the function itself is misspelled, just use it like this.
	capContactModel.setPeople(theContact);
	var birthDate = theContact.getBirthDate();
	if (birthDate != null && birthDate != "") {
		capContactModel.setBirthDate(aa.util.parseDate(birthDate));
	}
	var peopleAttributes = aa.people.getPeopleAttributeByPeople(theContact.getContactSeqNumber(), theContact.getContactType()).getOutput();
	if (peopleAttributes) {
		var newPeopleAttributes = aa.util.newArrayList();
		for ( var i in peopleAttributes) {
			newPeopleAttributes.add(peopleAttributes[i].getPeopleAttributeModel())
		}
		capContactModel.getPeople().setAttributes(newPeopleAttributes)
	}
	capModel.getContactsGroup().add(capContactModel);

}

function copyASIFromParent4ACA(currentRecordCapModel, parentCapId, typesArray) {
	var asiGroups = currentRecordCapModel.getAppSpecificInfoGroups();
	var asiArray = new Array();
	loadAppSpecific4ACA(asiArray, parentCapId);
	setFieldValue(asiArray, asiGroups, typesArray);
}

function copyAsitFromParent4ACA(currentRecordCapModel, parentCapId, typesArray) {
	var currentRecordAsitGroups = capModel.getAppSpecificTableGroupModel();

	if (currentRecordAsitGroups == null || currentRecordAsitGroups.getTablesMap() == null) {
		return;
	}

	var ta = currentRecordAsitGroups.getTablesMap().values();
	var tai = ta.iterator();
	while (tai.hasNext()) {
		var tsm = tai.next();
		var tableName = "" + tsm.getTableName().toString();
		if (typesArray != null && !arrayContainsValue(typesArray, tableName)) {
			continue;
		}
		var asitArray = loadASITable(tableName, parentCapId);
		currentRecordAsitGroups = addASITable4ACAPageFlowCamp(currentRecordAsitGroups, tableName, asitArray, capModel.getCapID());
	}
}

function setFieldValue(asiValuesArray, asiGroups, typesArray) {
	if (asiGroups == null) {
		return false;
	}
	var iteGroups = asiGroups.iterator();
	while (iteGroups.hasNext()) {
		var group = iteGroups.next();
		if (typesArray != null && !arrayContainsValue(typesArray, group.getGroupName())) {
			continue;
		}
		var fields = group.getFields();
		if (fields != null) {
			var iteFields = fields.iterator();
			while (iteFields.hasNext()) {
				var field = iteFields.next();
				field.setChecklistComment(asiValuesArray[field.getCheckboxDesc()]);
			}
		}
	} //for all groups
	return true;
}

function addASITable4ACAPageFlowCamp(destinationTableGroupModel, tableName, tableValueArray) {
	var itemCap = capId
	if (arguments.length > 3)
		itemCap = arguments[3];

	if (destinationTableGroupModel == null || destinationTableGroupModel.getTablesMap() == null) {
		return;
	}

	var ta = destinationTableGroupModel.getTablesMap().values();
	var tai = ta.iterator();

	var found = false;
	while (tai.hasNext()) {
		var tsm = tai.next();
		if (tsm.getTableName().equals(tableName)) {
			if (tsm.getTableFields() != null && tsm.getTableFields().size() > 0) {
				return destinationTableGroupModel;
			}
			found = true;
			break;
		}
	}

	if (!found) {
		logDebug("cannot update asit for ACA, no matching table name");
		return false;
	}

	var i = -1;
	if (tsm.getTableFields() != null) {
		i = 0 - tsm.getTableFields().size()
	}

	for (thisrow in tableValueArray) {
		var fld = aa.util.newArrayList();
		var fld_readonly = aa.util.newArrayList();
		var col = tsm.getColumns()
		var coli = col.iterator();
		while (coli.hasNext()) {
			var colname = coli.next();
			if (!tableValueArray[thisrow][colname.getColumnName()]) {
				logDebug("addToASITable: null or undefined value supplied for column " + colname.getColumnName() + ", setting to empty string");
				tableValueArray[thisrow][colname.getColumnName()] = "";
			}

			if (typeof (tableValueArray[thisrow][colname.getColumnName()].fieldValue) != "undefined") {
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()].fieldValue ? tableValueArray[thisrow][colname.getColumnName()].fieldValue : "", colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
				fldToAdd.setReadOnly(tableValueArray[thisrow][colname.getColumnName()].readOnly.equals("Y"));
				fld.add(fldToAdd);
				fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);

			} else {
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()] ? tableValueArray[thisrow][colname.getColumnName()] : "", colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
				fldToAdd.setReadOnly(false);
				fld.add(fldToAdd);
				fld_readonly.add("N");
			}
		}
		i--;
		if (tsm.getTableFields() == null) {
			tsm.setTableFields(fld);
		} else {
			tsm.getTableFields().addAll(fld);
		}
		if (tsm.getReadonlyField() == null) {
			tsm.setReadonlyField(fld_readonly);
		} else {
			tsm.getReadonlyField().addAll(fld_readonly);
		}
	}

	tssm = tsm;
	return destinationTableGroupModel;
}

/**
 * puts capId1 and capId2 in an array ["src"], ["dest"] based on copyDirection
 * @param capId1 CapID of current record
 * @param capId2 CapID of Other record
 * @param copyDirection Number, TO_PARENT=1, FROM_PARENT=2 and TO_CHILD=3
 * @returns Associative array ["src"], ["dest"], or false if copyDirection not supported
 */
function getCopySrcDest(capId1, capId2, copyDirection) {
	var srcDestArr = new Array();
	if (copyDirection == TO_PARENT || copyDirection == TO_CHILD) {
		srcDestArr["src"] = capId1;
		srcDestArr["dest"] = capId2;
	} else if (copyDirection == FROM_PARENT) {
		srcDestArr["src"] = capId2;
		srcDestArr["dest"] = capId1;
	} else {
		return false;
	}
	return srcDestArr;
}

function getCopyTypesArray(copyTypes) {
	if (copyTypes && copyTypes != null && copyTypes != "" && copyTypes.length > 0 && copyTypes[0].equalsIgnoreCase("all")) {
		return null;
	} else if (copyTypes == null || copyTypes == "") {
		return new Array();
	} else {
		return copyTypes;
	}
}

// this function update ASIT row with the new value
function UpdateASITRow(row, name, value) {
	var field = {};
	field.row = row;
	field.name = name;
	if (value == null) {
		value = "";
	}
	field.value = value;
	return field;

}
//this function check if the field is exists in the ASIT row
function hasField(fields, row, name) {

	var ret = false;
	for (x in fields) {
		var f = fields[x];
		if (f.row == row && f.name.toLowerCase() == name.toLowerCase()) {
			ret = true
			break;
		}
	}

	return ret;
}
// this function get the ASIT column value
function getASITFieldValue(fields, row, name) {
	var ret = null;
	for (x in fields) {
		var f = fields[x];
		if (f.row == row && f.name.toLowerCase() == name.toLowerCase()) {
			ret = f.value + "";
			break;
		}
	}
	return ret;
}
//this function to update the ASIT rows based on the new values
function updateASITColumns(asitRows, tableName) {

	if (asitRows.length == 0) {
		logDebug("**ERROR: : noting was sent to update");

	}
	//var tableName = asit.getTableName();
	if (tableName == "") {
		logDebug("ERROR: tableName cannot be Empty");
	}
	var tsm = aa.appSpecificTableScript.getAppSpecificTableModel(this.capId, tableName);
	if (!tsm.getSuccess()) {
		logDebug("ERROR: error retrieving app specific table " + tableName + " " + tsm.getErrorMessage());

	}

	var tsm = tsm.getOutput();
	var tsm = tsm.getAppSpecificTableModel();
	var cells = tsm.getTableField();
	var NumberOfCells = cells.size();
	var newtableFields = aa.util.newArrayList();
	var fields = tsm.getTableFields().iterator();
	var columns = aa.util.newArrayList();
	var columnScripts = tsm.getColumns();
	var NumberOfColumns = columnScripts.size();
	var NumberOfRows = Math.ceil(NumberOfCells / NumberOfColumns);

	if (NumberOfColumns < 0) {
		logDebug("invalid number of columns");
	}
	// set columns
	var colNames = [];
	for (var iterator = columnScripts.iterator(); iterator.hasNext();) {
		var scriptModel = iterator.next();
		columns.add(scriptModel.getColumnModel());
		colNames.push(scriptModel.getColumnName());
	}
	tsm.setColumns(columns);
	// set table fields
	var editedMsg = "";
	var edited = 0;
	for (var ri = 0; ri < NumberOfRows; ri++) {
		for (var colIndex = 0; colIndex < NumberOfColumns; colIndex++) {
			var cname = colNames[colIndex];
			var rowinIndexDB = fields.next().getRowIndex();
			var val = cells.get((ri * NumberOfColumns) + colIndex);
			if (hasField(asitRows, ri, cname)) {
				var newValue = getASITFieldValue(asitRows, ri, cname);
				editedMsg += "** " + cname + "[" + ri + "]=" + newValue + ", was " + val + "\n";
				val = newValue;
				edited++;

			}
			if (val == null) {
				val = "";
			}

			var res = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", [ val, columns.get(colIndex) ]);
			if (!res.getSuccess()) {
				logDebug("field creationg failed: " + res.getErrorMessage());
			}
			field = res.getOutput();
			field.setFieldLabel(cname);
			field.setRowIndex(rowinIndexDB);
			newtableFields.add(field);

		}

	}
	if (edited != asitRows.length) {
		logDebug("ERROR: Could not edit all edited fields! only " + edited + "/" + asitRows.length + " was edited:\n" + editedMsg);
	}
	tsm.setTableFields(newtableFields);

	var gsiBiz = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableBusiness").getOutput();
	gsiBiz.editAppSpecificTableInfos(tsm, this.capId, aa.getAuditID())
	logDebug("Successfully edited ASI Table: " + tableName + ". " + edited + " Cell(s) was edited:\n" + editedMsg);
	return edited;
}

/**
 * 
 * @param emailAddress
 * @param contactSeqNumber
 * @returns
 */
function getOrCreatePublicUser(emailAddress, contactSeqNumber) {

	var userModel = null;
	//check if exist
	var getUserResult = aa.publicUser.getPublicUserByEmail(emailAddress)
	if (getUserResult.getSuccess() && getUserResult.getOutput()) {
		userModel = getUserResult.getOutput();
		return userModel;
	}

	//create public User
	var capContact = aa.people.getCapContactByContactID(contactSeqNumber);
	if (!capContact.getSuccess()) {
		logDebug("**Warning getOrCreatePublicUser :: getCapContactByContactID " + contactSeqNumber + "  failure: " + capContact.getErrorMessage());
		return null;
	}
	capContact = capContact.getOutput();
	if (capContact.length == 0) {
		return null;
	}
	capContact = capContact[0];
	var thisContactRefId = capContact.getCapContactModel().getRefContactNumber();

	var publicUser = aa.publicUser.getPublicUserModel();
	publicUser.setFirstName(capContact.getFirstName());
	publicUser.setLastName(capContact.getLastName());
	publicUser.setEmail(capContact.getEmail());
	publicUser.setUserID(capContact.getEmail());
	publicUser.setPassword("e8248cbe79a288ffec75d7300ad2e07172f487f6"); //password : 1111111111
	publicUser.setAuditID("PublicUser");
	publicUser.setAuditStatus("A");
	publicUser.setCellPhone(capContact.getPeople().getPhone2());

	var result = aa.publicUser.createPublicUser(publicUser);
	if (result.getSuccess()) {

		var userSeqNum = result.getOutput();
		userModel = aa.publicUser.getPublicUser(userSeqNum).getOutput()

		// create for agency
		aa.publicUser.createPublicUserForAgency(userModel);

		// activate for agency
		var userPinBiz = aa.proxyInvoker.newInstance("com.accela.pa.pin.UserPINBusiness").getOutput()
		userPinBiz.updateActiveStatusAndLicenseIssueDate4PublicUser(servProvCode, userSeqNum, "ADMIN");

		// reset password
		var resetPasswordResult = aa.publicUser.resetPassword(emailAddress);
		if (resetPasswordResult.getSuccess()) {
			var resetPassword = resetPasswordResult.getOutput();
			userModel.setPassword(resetPassword);
		} else {
			logDebug("**WARN: getOrCreatePublicUser ::  Reset password for  " + capContact.getEmail() + "  failure:" + resetPasswordResult.getErrorMessage());
		}

		// send Activate email
		aa.publicUser.sendActivateEmail(userModel, true, true);

		// send another email
		aa.publicUser.sendPasswordEmail(userModel);
	} else {
		logDebug("**Warning getOrCreatePublicUser ::  create publicUser " + capContact.getEmail() + "  failure: " + result.getErrorMessage());
		return null;
	}

	//  Now that we have a public user let's connect to the reference contact		
	if (thisContactRefId) {
		aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), thisContactRefId);
	}
	return userModel;
}

function isLicenseConnectedToPublicUser(userNum, licenseNum) {
	try {
		var userSeqList = aa.util.newArrayList();
		userSeqList.add(userNum);
		var contractorLicenseBiz = aa.proxyInvoker.newInstance("com.accela.pa.people.license.ContractorLicenseBusiness").getOutput()
		var licenses = contractorLicenseBiz.getContrLicListByUserSeqNBR(userNum, aa.getServiceProviderCode()); // Array List
		if (licenses) {
			licArr = licenses.toArray();
			for (lIndex in licArr) {
				thisLic = licArr[lIndex];
				licModel = thisLic.getLicense();
				licNumber = licModel.getStateLicense();
				if (licNumber == licenseNum)
					return true;
			}
		}
	} catch (err) {
		logDebug(err);
		return false;
	}
	return false;
}

function associateLPToPublicUser(licenseNum, userNum) {
	var licResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(), licenseNum);
	if (licResult.getSuccess()) {
		var licObj = licResult.getOutput();
		if (licObj != null) {
			licObj = licObj[0];
			puResult = aa.publicUser.getPublicUser(userNum);
			if (puResult.getSuccess()) {
				pu = puResult.getOutput();
				if (pu != null) {
					assocResult = aa.licenseScript.associateLpWithPublicUser(pu, licObj);
					if (!assocResult.getSuccess())
						logDebug("**WARN associateLPToPublicUser :: Link failed " + licenseNum + " : " + assocResult.getErrorMessage());
				} else {
					logDebug("associateLPToPublicUser :: Public user object is null");
				}
			} else {
				logDebug("Error associateLPToPublicUser :: getting public user account " + puResult.getErrorMessage());
			}
		} else {
			logDebug("associateLPToPublicUser :: lp object is null");
		}
	} else {
		logDebug("Error associateLPToPublicUser :: " + licResult.getErrorMessage());
	}
}

/**
 * replace * in cap type with corresponding parts from current cap type,
 * returns false if type to return is not exist on the env
 * 
 * @param appTypeToCreate {Array} 4-levels cap type (to be created)
 * @returns replaced array or false
 */
function prepareAppTypeArray(appTypeToCreate) {

	if (appTypeToCreate == null || appTypeToCreate.length != 4) {
		logDebug("**ERROR prepareAppTypeArray(): provided appTypeToCreate is empty or not valid (4 levels)");
		return false;
	}

	//no wildcard in cap type
	if (appTypeToCreate.indexOf("*") == -1) {
		return appTypeToCreate;
	}

	if (typeof appTypeArray == "undefined" || appTypeArray == null || appTypeArray == "" || appTypeArray.length == 0) {
		//appTypeArray=
		if (capId != null) {
			var itemCap = aa.cap.getCap(capId).getOutput();
			appTypeString = itemCap.getCapType().getValue();
			appTypeArray = appTypeString.split('/');
		} else {
			logDebug("**ERROR prepareAppTypeArray(): appTypeArray not exist or not initialized");
			return false;
		}
	}

	//replace any '*' in parent type with corresponding value from current record type.
	for (x in appTypeToCreate) {
		if (appTypeToCreate[x] == "*") {
			appTypeArray
			appTypeToCreate[x] = appTypeArray[x];
		}
	}

	//validate required Record Type is exist on Env
	var capTypeList = aa.cap.getCapTypeListByModule(appTypeToCreate[0], null);
	if (capTypeList.getSuccess()) {
		capTypeList = capTypeList.getOutput();

		var tmpReqType = appTypeToCreate.join("/");
		for (c in capTypeList) {
			if (capTypeList[c].getCapType().getValue() == tmpReqType) {
				return appTypeToCreate;
			}
		}//for all existing types
		logDebug("**ERROR prepareAppTypeArray(): required parent type (parentLicense):" + tmpReqType + " not found");
	} else {
		logDebug("**ERROR prepareAppTypeArray(): failed to get getCapTypeListByModule, error: " + capTypeList.getErrorMessage());
	}
	return false;
}