/**
 * This directive prevents links from opening in the Safari
 * app when using the website in iOS standalone mode
 */
angular.module("href", []).directive("href", function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      if ("standalone" in window.navigator && navigator.standalone) {
        element.bind("click", e=>{
          if ("href" in attrs) {
            e.preventDefault();
            window.location.href = attrs.href;
          }
        })
      }
    }
  };
});