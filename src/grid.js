//#CSS from external file required
/**
 * Manages a nice grid table with sticky headers.
 * Row headings should have the class row-heading, and column headings should have the class column-heading.
 * All headings will be realigned on window scrolling or resizing, and it will be called automatically whenever "realignment-needed" is broadcasted to the scope.
 * There are two ways to make sure elements appear in the right row and column:
 *   1. (Easiest) Specify the attributes "row" and "column" for every sibling of the grid.
 *   2. Specify the CSS "grid-area" attribute or similar on all children of the grid, and - if you are using row or column headings - make sure that:
 *      - Row headings and the belonging elements are direct siblings (each element is assumed to belong to the first preceeding row heading).
 *      - Column headings and the belonging elements are children of a .column element (only one column heading in each .column element)
 * If you are using row headings you need to speicify the "grid-template-columns" CSS attribute on the root element, with the value corresponding to the width-value of the row headings.
 * If a .column or .row has the .master class, it will be the heighest or widest, respectively, among its siblings. A "show all"-button will be added to the siblings that have hidden children.
 * If you are using column headings, you might want to manually set a padding-top on your grid, to prevent elements from moving when initalizing.
 * If a child of the grid has the HTML attribute "limit-height" og "limit-width", its height or width will be regulated to the value of the attribute by replacing some children with a "show all"-button.
 */
angular.module("grid", []).directive("grid", ["$compile", "$window", function ($compile, $window) {
  return {
    restrict: 'A',
    link: function (scope, grid, attrs) {
      /**
       * Remove temporary upper limitations on height and width (set in setMinDims()) before calling the other functions
       */
      function realign() {
        grid.children().css({"min-height": "", "min-width": ""});
        fixVisibility();
      }
      /**
       * Controls which table cells to show and not (some are replaced with "show all"-buttons)
       */
      function fixVisibility() {
        grid.findAll(".master").forEach(master=>{
          // Hide cells to make sure no slaves are higher or wider than their master
          const isCol = master.classList.contains("column");
          const lengthAttr = isCol ? "clientHeight" : "clientWidth";
          let masterLength = Math.max(150, [...master.children].map(el=>el[lengthAttr]).reduce((prev, next)=>prev + next));
          let sibling = master.nextElementSibling;
          while (sibling && sibling.classList.contains(isCol ? "column" : "row") && !sibling.classList.contains("master")) {
            sibling.limitHeightOrWidth(isCol ? "height" : "width", masterLength);
            sibling = sibling.nextElementSibling;
          }
        });

        // Respect values set in the HTML attributes "limit-height" and "limit-width"
        ["height", "width"].forEach(prop=>grid.findAll(`[limit-${prop}]`).forEach(div=>div.limitHeightOrWidth(prop, div.getAttribute("limit-"+prop))));
        fixTHDimensions();
      }
      /**
       * Expansion of HTMLElement prototype that hides some children and replaces them with a butten if the parent is too large
       * @param  {string} dimension Either 'height' or 'width'
       * @param  {number} value     Max amount of pixels
       */
      HTMLElement.prototype.limitHeightOrWidth = function (dimension, value) {
        if (!this.querySelector(".clicked")) {
          if (this.querySelector(".expand")) this.querySelector(".expand").remove();
          let length = 0, i = 0;
          while (length < value && i < this.children.length) {
            length += dimension === 'height' ? this.children[i].clientHeight : this.children[i].clientWidth;
            i++;
          }
          const btn = $compile(`<button onclick="this.classList.add('clicked')" class="expand">Vis alt</button>`)(scope);
          btn.bind("click", realign);
          if (i < this.children.length) angular.element(this.children[Math.max(i-3, 0)]).after(btn);
        }
      };
      
      /**
       * Fixes the height and width of all elements in the grid with the classes row-heading and column-heading
       */
      function fixTHDimensions() {
        grid.findAll(".row-heading").forEach(div=>{
        	let newHeight = 0;
        	if (grid.find("[row]").length) {
        		grid.findAll(`[row="${div.getAttribute("row")}"]`).forEach(td=>{
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
        grid.findAll(".column-heading").forEach(div=>{
          let newWidth = 0;
          let selector = `[column="${div.getAttribute("column")}"]`;
          if (div.parentElement.classList.contains("column")) newWidth = div.parentElement.clientWidth;
          else if (grid.find(selector).length) {
            grid.findAll(selector).forEach(td=>{
              if (!td.classList.contains("column-heading")) newWidth = Math.max(newWidth, td.clientWidth);
            });
          } else if (div.nextElementSibling) newWidth = div.nextElementSibling.clientWidth;
          else newWidth = div.parentElement.clientWidth;
          div.style.maxWidth = newWidth+"px";
        });
        let childrenWidth = 0;
        grid.findAll("[row='1']").forEach(node=>childrenWidth += node.clientWidth);
        fixTHPositions();
      }
      /**
       * Fixes positions of all elements with the classes row-heading and column-heading
       */
      function fixTHPositions() {
        if (grid.find(".row-heading").length) {
          grid.findAll(".row-heading").forEach(div=>{
            let computed_top = "", position = "fixed";
            if (!div.slave) {
              let selector = `[row="${div.getAttribute("row")}"]`;
              if (grid.findAll(selector).length > 1) div.slave = grid.findAll(selector)[1];
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
        const colHeadings = grid.findAll(".column-heading");
        colHeadings.fixed = true;
        colHeadings.height = 0;
        colHeadings.areChildOfCol = colHeadings.parent().hasClass("column");
        colHeadings.forEach(div=>{
          let computed_left = "";
          if (!div.hasOwnProperty("slave")) {
            let selector = `[column="${div.getAttribute("column")}"]`;
            if (grid.findAll(selector).length > 1) div.slave = grid.findAll(selector)[1];
            else div.slave = div.parentElement;
          }
          computed_left = div.slave.getBoundingClientRect().x+"px";
          if (div.last_computed_left !== computed_left) {
            div.style.left = "";
            div.style.top = $window.scrollY+"px";
            colHeadings.fixed = false;
          } else {
            div.style.left = computed_left;
            div.style.top = "";
          }
          div.last_computed_left = computed_left;
          colHeadings.height = Math.max(colHeadings.height, div.clientHeight);
        });
        colHeadings.css("position", colHeadings.fixed ? "fixed" : "absolute");
        colHeadings.css("margin-top", !colHeadings.fixed || colHeadings.areChildOfCol ? `-${colHeadings.height+2}px` : "");
        grid.css("padding-top", `${colHeadings.height}px`);
        if (!colHeadings.fixed) colHeadings.css("left", "");

        setMinDims();
      }

      function setMinDims() {
        ["row", "column"].forEach(rowOrColumn=>{
          const idAttr = rowOrColumn === "row" ? "gridRowStart" : "gridColumnStart";
          const dimension = rowOrColumn === "row" ? "Height" : "Width";
          grid.findAll(`.${rowOrColumn}-heading`).forEach(heading=>{
            grid.children().forEach(el=>{
              if (el.style[idAttr] === heading.style[idAttr] && !el.classList.contains("row-heading") && !el.classList.contains("column-heading")) {
                el.style["min"+dimension] = heading["client"+dimension]+"px";
              }
            })
          })
        })
      }

      angular.element($window.document).ready(realign);
      $window.onscroll = fixTHPositions;
      $window.onresize = realign;
      scope.$on("realignment-needed", realign); // Realign when requested
    }
  };
}])
.directive("column", rowOrColumnAttr("column"))
.directive("row", rowOrColumnAttr("row"))
.directive("ngRow", ngRowOrColumnAttr("row"))
.directive("ngColumn", ngRowOrColumnAttr("column"));

/** Helper directives that sets CSS based on the custom HTML attributes "column" and "row" */
function rowOrColumnAttr(attr, linkFn) {
  return [function () {
    return {
      restrict: 'A',
      link: typeof linkFn === "function" ? linkFn : function (scope, el, attrs) {
        el.css("grid-"+attr, attrs[attr]);
      }
    };
  }];
}
/** If the row and column attributes are preceded by "ng-", the CSS will update if the expression in the attribute changes. Should only be used when the expressions actually change, to avoid unnecessary watchers */
function ngRowOrColumnAttr(attr) {
  return rowOrColumnAttr(attr, function (scope, el, attrs) {
    let expression = attrs["ng"+attr.charAt(0).toUpperCase()+attr.slice(-2)];
    scope.$watch(expression, ()=>{
      el.css("grid-"+attr, scope.$eval(expression));
      el.attr(attr, scope.$eval(expression));
    });
  });
}