angular.module("notifs", ["selectors"])
/**
 * Create a good looking notification with contextual color
 * @param  {string} innerHTML The inner HTML of the new notification element
 * @param  {string} status    Gives color to the element, options are "error", "success" and "warning"
 * @param  {string} $scope    (Optional) Any scope (Will serve as parent scope for a new scope created for each element). $rootScope will be used if not supplied.
 */
.service("notify", ["$compile", "$rootScope", function ($compile, $rootScope) {
  return function (innerHTML, status, $scope) {
    let element = angular.element($compile(`<div notif ink-list removable="disappear()">${innerHTML}</div>`)(typeof $scope !== "undefined" ? $scope.$new() : $rootScope.$new()));
    element.addClass(status);
    angular.element(document.body).append(element);
  };
}])
/**
 * Manages the notifications
 */
.directive("notif", ["$timeout", "q", function ($timeout, q) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      if (!document.querySelector(".notif-container")) angular.element(document.body).prepend(angular.element(`<div class="notif-container"></div>`));
      $timeout(()=>q(".notif-container").append(element), 0);
      element.addClass("status");
      disappear(5000);
      scope.disappear = disappear;

      function disappear(timeout) {
        $timeout(()=>{
          element.addClass("disappear");
          $timeout(()=>element.remove(), 10000);
        }, timeout);
      }
    }
  }
}]);
