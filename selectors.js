angular.module("selectors", [])
.value("q", s=>angular.element(document.querySelector(s)))
.value("qa", s=>angular.element(document.querySelectorAll(s)))
.run(function () {
	// Support CSS3 query selectors in angular JQLite find method
	angular.element.prototype.find = function (q) {
	  return angular.element(this[0].querySelector(q));
	}
	// Method to find all by CSS3 query selector
	angular.element.prototype.findAll = function (q) {
	  return angular.element(this[0].querySelectorAll(q));
	}
});