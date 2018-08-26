//#CSS from external file required
/**
 * Will create a nice "✖" mark inside the element with
 *   the "removable"-attribute if the value in the
 *   "removable"-attribute is a string with length.
 * When the "✖" is clicked, the string expression in
 *   the "removable"-attribute will be evaluated in
 *   the scope.
 */
angular.module("removable", ["events", "selectors"]).directive("removable", ["isClick", "q", function (isClick, q) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      if (attrs.removable.length) {
        if (!element.find("a[tabindex]").length) element.prepend(angular.element("<a tabindex=0>✖</a>"));
        element.find("a").bind("click keypress", e=>{
          if (isClick(e)) {
            e.preventDefault();
            e.target.blur();
            element.remove();
            scope.$eval(attrs.removable);
          }
        });
      } else element[0].removeAttribute("removable");
    }
  };
}]);
