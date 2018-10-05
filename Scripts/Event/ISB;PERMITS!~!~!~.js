if (appMatch('Permits/*/*/*') && inspType == 'Building Final' && balanceDue > 0) {
	cancel = true;
	showMessage = true;
	comment('<font color=red><b>Final inspection cannot be scheduled until fees have been paid.</b></font>');

}