// This module adds a method to the Array prototype
angular.module("arrays", []).run(function () {
	// Function to check if array has object with property `prop` with value `val`
	Array.prototype.hasObjWithPropVal = function (prop, val) {
	  for (let i = 0; i < this.length; i++) if (this[i][prop] == val) return true;
	  return false;
	};
});
