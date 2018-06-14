angular.module("expansions", []).run([function () {
	// Implement foreach method on angular elements
	angular.element.prototype.forEach = function (f) {
	  return angular.forEach(this, f);
	}
}]);