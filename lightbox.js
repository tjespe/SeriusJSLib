/*
* Module for creating and managing lightboxes.
* Functionality:
*   - Use the initLightbox service to initiate a lightbox
*   - A clickable cross will be added to the lightbox, it will close the lightbox when clicked
*   - The lightbox can also be clicked by pressing the escape key
*/
angular.module("lightboxes", [])
/**
 * Initiate a lightbox
 */
.service("initLightbox", ["$compile", "$rootScope", function ($compile, $rootScope) {
  return function (innerHTML, $scope) {
    let el = angular.element("<div lightbox>"+innerHTML+"</div>");
    el.children().attr("removable", "disappear()");
    angular.element(document.body).append($compile(el)(typeof $scope !== "undefined" ? $scope : $rootScope.$new()));
  };
}])
/**
 * Manages the lightbox
 */
.directive("lightbox", ["$timeout", "$window", function ($timeout, $window) {
  return {
    link: function (scope, element, attrs) {
      angular.element($window).bind("keyup", event=>{
        if (event.key === "Escape") scope.disappear();
      });
      scope.disappear = ()=>{
        element.addClass("disappear");
        $timeout(()=>element.remove(), 500);
      };
    }
  }
}]);
