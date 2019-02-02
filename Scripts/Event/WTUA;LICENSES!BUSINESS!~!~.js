if ((appMatch('Licenses/Business/Restaurant/Application')) && isTaskActive('Zoning Review') || isTaskActive('Building Review')) {
	email("airkulla@accela.com","airkulla@accela.com","Ready for Review","Please perform the necessary task that has been assigned to you.");
}
