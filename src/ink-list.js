//#CSS from external file required
/**
 * Creates a ripple ink effect when a child of an element with the HTML attribute "ink-list" is clicked
 * Optional: You can specify a desired ink color by using the HTML attribute "ink-color" on the ink-list
 */
angular.module("ink-list", ["events"]).directive("inkList", ["$timeout", "q", "isClick", function ($timeout, q, isClick) {
  return {
    link: function($scope, $element, $attrs) {
      let vm = this;
      angular.element(document).ready(()=>$timeout(()=>{ // Wait for DOM to get ready and wrap the below code in a timeout
        angular.element($element).on("mousedown", e=>e.target.blur());
        angular.element($element).on("click keypress", function (e) { // Bind the code below to click and touchstart events
          if (isClick(e)) {
            let parent = e.target; // Use the clicked element as parent for the ink
            while (parent.parentElement && !parent.parentElement.hasAttribute("ink-list")) parent = parent.parentElement; // Use the parent of the clicked element if it is not a child directly below the ink-list-element
            if (!parent.parentElement) return;
            let child = document.createElement("span"); // Create the ink element
            child.classList.add("ink");
            if (parent.querySelector(".ink") === null) parent.insertBefore(child, parent.firstChild); // Prepend the ink element to `parent`
            let ink = parent.querySelector(".ink"); // Get the ink element
            if ($attrs.hasOwnProperty("inkColor")) ink.style.backgroundColor = $attrs.inkColor;
            ink.classList.remove("animate");
            if (!Number(getComputedStyle(ink).height.slice(0,-2)) && !Number(getComputedStyle(ink).width.slice(0,-2))) { // Give the ink height and width if the ink has no height and no width
              let d = Math.max(parent.offsetWidth, parent.offsetHeight);
              ink.style.height = d + "px";
              ink.style.width = d + "px";
            }
            let x = e.clientX - parent.getBoundingClientRect().left - getComputedStyle(ink).width.slice(0,-2) / 2; // Calculate x postition
            let y = e.clientY - parent.getBoundingClientRect().top - getComputedStyle(ink).height.slice(0,-2) / 2; // Calculate y position
            ink.style.top = y + "px";
            ink.style.left = x + "px";
            ink.classList.add("animate"); // Add CSS animation
            $timeout(()=>angular.element(ink).remove(), 500); // Remove the ink element after half a second
          }
        });
      }, 50));
    }
  };
}]);
