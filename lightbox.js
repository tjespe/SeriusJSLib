angular.module("lightboxes", [])
/**
 * Initiate a lightbox
 */
.service("initLightbox", ["$compile", function ($compile) {
  return function (innerHTML, $scope) {
    let el = angular.element("<div lightbox>"+innerHTML+"</div>");
    el.children().attr("removable", "disappear()");
    angular.element(document.body).append($compile(el)($scope));
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
      }
    }
  }
}]);