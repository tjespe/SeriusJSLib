/**
 * Will create a nice "✖" mark inside the element with
 *   the "removable"-attribute if the value in the
 *   "removable"-attribute is a string with length.
 * When the "✖" is clicked, the string expression in
 *   the "removable"-attribute will be evaluated in
 *   the scope.
 */
angular.module("removable", ["events", "selectors"]).directive("removable", ["isClick", "q", function (isClick, q) {
  q("style").append(`
  [removable] {
    position: relative;
    overflow: hidden;
  }
  [removable]>a {
    align-items: center;
    color: #337ab7;
    cursor: pointer;
    display: flex;
    height: 100%;
    min-width: unset;
    position: absolute;
    padding-right: 2px;
    right: 0;
    top: 0;
    background: inherit;
  }
  [removable]>a:hover {
    text-shadow: 0px 0px 10px #aaa;
    pointer-events:auto;
  }
  [removable]>a:focus {
    outline: 0;
    text-shadow: 0 0 10px;
  }
  [removable]>select+a, .hidden a {
    display: none;
  }
  @keyframes disappear {
    100% {
      border: 0;
      opacity: 0;
      min-height: 0;
      max-height: 0;
      margin-top: 0;
      margin-bottom: 0;
      padding-top: 0;
      padding-bottom: 0;
    }
  }
  @keyframes shrink {
    0% { max-width: 100% }
    100% { max-width: 0 }
  }
  [removable].disappear {
    animation: disappear 0.5s forwards, shrink 0.5s linear 9.5s !important;
  }`);
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      if (attrs.removable.length) {
        if (!element.find("a[tabindex]").length) element.append(angular.element("<a tabindex=0>✖</a>"));
        element.find("a").bind("click keypress", e=>{
          if (isClick(e)) {
            e.preventDefault();
            e.target.blur();
            element.parent().attr("lightbox") !== undefined ? element.parent().addClass("disappear") : element.addClass("disappear");
            scope.$eval(attrs.removable);
          }
        });
      }
    }
  };
}]);