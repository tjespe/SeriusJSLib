//#CSS from external file required
/**
 * Manages a nice grid table with sticky headers.
 * Row headings should have the class row-heading, and column headings should have the class column-heading.
 * All headings will be realigned on window scrolling or resizing, but the realign method is also available in the scope, so it can be called externally if the content changes.
 * There are two ways to make sure elements appear in the right row and column:
 *   1. (Easiest) Specify the attributes "row" and "column" for every sibling of the grid.
 *   2. Specify the CSS "grid-area" attribute or similar on all children of the grid, and - if you are using row or column headings - make sure that:
 *      - Row headings and the belonging elements are direct siblings (each element is assumed to belong to the first preceeding row heading).
 *      - Column headings and the belonging elements are children of a .column element (only one column heading in each .column element)
 * If you are using row headings you need to speicify the "grid-template-columns" CSS attribute on the root element, with the value corresponding to the width-value of the row headings.
 * If a .column or .row has the .master class, it will be the heighest or widest, respectively, among its siblings. A "show all"-button will be added to the siblings that have hidden children.
 */
angular.module("grid", []).directive("grid", ["$compile", "$window", function ($compile, $window) {
  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
      /**
       * Controls which table cells to show and not
       */
      function fixVisibility() {
        elem.findAll(".master").forEach(master=>{
          let isCol = master.classList.contains("column");
          let masterLength = isCol ? master.clientHeight : master.clientWidth;
          if (masterLength < 150) masterLength = 150;
          let sibling = master.nextElementSibling;
          while (sibling && sibling.classList.contains(isCol ? "column" : "row") && !sibling.classList.contains("master")) {
            sibling.limitHeightOrWidth(isCol ? "height" : "width", masterLength);
            sibling = sibling.nextElementSibling;
          }
        });
        ["height", "width"].forEach(prop=>elem.findAll(`[limit-${prop}]`).forEach(div=>div.limitHeightOrWidth(prop, div.getAttribute("limit-"+prop))));
        fixTHDimensions();
      }
      /**
       * Expansion of HTMLElement prototype that is used in 'fixVisibility' function
       * @param  {string} dimension Either 'height' or 'width'
       * @param  {number} value     Max amount of pixels
       */
      HTMLElement.prototype.limitHeightOrWidth = function (dimension, value) {
        if (!this.querySelector(".clicked")) {
          if (el = this.querySelector(".expand")) el.remove();
          let length = 0, i = 0;
          while (length < value && i < this.children.length) {
            length += dimension === 'height' ? this.children[i].clientHeight : this.children[i].clientWidth;
            i++;
          }
          if (i < this.children.length) angular.element(this.children[Math.max(i-3, 0)]).after($compile(`<button onclick="this.classList.add('clicked')" ng-click="realign()" class="expand">Vis alt</button>`)(scope));
        }
      };
      /**
       * Fixes the height and width of all elements in the grid with the classes row-heading and column-heading
       */
      function fixTHDimensions() {
        elem.findAll(".row-heading").forEach(div=>{
        	let newHeight = 0;
        	if (elem.find("[row]").length) {
        		elem.findAll(`[row="${div.getAttribute("row")}"]`).forEach(td=>{
        			if (!td.classList.contains("row-heading")) newHeight = Math.max(newHeight, td.clientHeight);
        		});
        	} else {
	          let sibling = div.nextElementSibling;
	          if (sibling) newHeight = sibling.clientHeight;
	          while (sibling && sibling.nextElementSibling && !sibling.nextElementSibling.classList.contains("row-heading")) {
	            sibling = sibling.nextElementSibling;
	            if (!sibling.classList.contains("row-heading")) newHeight = Math.max(sibling.clientHeight, newHeight);
	          }
        	}
          div.style.height = newHeight+"px";
        });
        elem.findAll(".column-heading").forEach(div=>{
          let newWidth = 0;
          let selector = `[column="${div.getAttribute("column")}"]`;
          if (div.parentElement.classList.contains("column")) newWidth = div.parentElement.clientWidth;
          else if (elem.find(selector).length) {
            elem.findAll(selector).forEach(td=>{
              if (!td.classList.contains("column-heading")) newWidth = Math.max(newWidth, td.clientWidth);
            });
          } else if (div.nextElementSibling) newWidth = div.nextElementSibling.clientWidth;
          else newWidth = div.parentElement.clientWidth;
          div.style.maxWidth = newWidth+"px";
        });
        let childrenWidth = 0;
        elem.findAll("[row='1']").forEach(node=>childrenWidth += node.clientWidth);
        if (childrenWidth > elem[0].clientWidth) elem.addClass("overflow");
        else elem.removeClass("overflow");
        fixTHPositions();
      }
      /**
       * Fixes positions of all elements with the classes row-heading and column-heading
       */
      function fixTHPositions() {
        if (elem.find(".row-heading").length) {
          elem.findAll(".row-heading").forEach(div=>{
            let computed_top = "", position = "fixed";
            if (!div.hasOwnProperty("slave")) {
              let selector = `[row="${div.getAttribute("row")}"]`;
              if (elem.findAll(selector).length > 1) div.slave = elem.findAll(selector)[1];
              else if (div.nextElementSibling) div.slave = div.nextElementSibling;
              else div.slave = null;
            }
            if (div.slave !== null) computed_top = div.slave.getBoundingClientRect().y+"px";
            else position = "relative";
            if (div.last_computed_top !== computed_top) {
              div.style.top = 0;
              div.style.left = $window.scrollX+"px";
              div.style.position = "absolute";
            } else {
              div.style.top = computed_top;
              div.style.left = "";
              div.style.position = position;
            }
            div.last_computed_top = computed_top;
          });
        }
        elem.findAll(".column-heading").forEach(div=>{
          let computed_left = "", position = "fixed";
          if (!div.hasOwnProperty("slave")) {
            let selector = `[column="${div.getAttribute("column")}"]`;
            if (elem.findAll(selector).length > 1) div.slave = elem.findAll(selector)[1];
            else div.slave = div.parentElement;
          }
          computed_left = div.slave.getBoundingClientRect().x+"px";
          if (div.last_computed_left !== computed_left) {
            div.style.left = 0;
            div.style.top = div.parentElement.classList.contains("column") ? $window.scrollY+"px" : ($window.scrollY-17)+"px";
            div.style.position = "absolute";
          } else {
            div.style.left = computed_left;
            div.style.top = "";
            div.style.position = position;
          }
          div.last_computed_left = computed_left;
        });
      }

      angular.element($window.document).ready(fixVisibility);
      $window.onscroll = fixTHPositions;
      $window.onresize = fixTHDimensions;
      scope.realign = fixVisibility; // Make realignment method available in scope
    }
  };
}])
.directive("column", rowOrColumnAttr("column"))
.directive("row", rowOrColumnAttr("row"))
.directive("ngRow", ngRowOrColumnAttr("row"))
.directive("ngColumn", ngRowOrColumnAttr("column"));

/** Helper directives that sets CSS based on the custom HTML attributes "column" and "row" */
function rowOrColumnAttr(attr) {
  return [function () {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        el.css("grid-"+attr, attrs[attr]);
      }
    };
  }];
}
/** If the row and column attributes are preceded by "ng-", the CSS will update if the expression in the attribute changes. Should only be used when the expressions actually change, to avoid unnecessary watchers */
function ngRowOrColumnAttr(attr) {
  return [function () {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        let expression = attrs["ng"+attr.charAt(0).toUpperCase()+attr.slice(-2)];
        scope.$watch(expression, ()=>{
          el.css("grid-"+attr, scope.$eval(expression));
          el.attr(attr, scope.$eval(expression));
        });
      }
    };
  }];
}
