angular.module("selectmore", [])
/**
 * Directive that extends the funcionality of select elements 
 *   by adding a "annet" field to the menu that upon selected
 *   will turn the select element into a text input field.
 *
 * Notes:
 *   No "annet" field will automatically be added if ng-options
 *   is used. Make sure to manually add an option with value "annet"
 */
.directive("select", ["$compile", "$timeout", function ($compile, $timeout) {
  return {
    restrict: 'E',
    link: function (scope, element, attrs) {
      if (!attrs.hasOwnProperty("ngOptions")) element.prepend(`<option value="annet">Annet</option>`);
      element.bind("change", e=>{
        e.target.blur();
        if (["annet", "string:annet"].includes(element[0].value.toLowerCase())) {
          let textInput = angular.element(`<input type="text">`);
          for (let attr in attrs) {
            if (attrs.hasOwnProperty(attr) && attr.charAt(0) !== "$" && attr !== "ngOptions") textInput.attr(attr.replace(/[A-Z]/g, match=>"-"+match.toLowerCase()), attrs[attr]);
            if (attr === "ngModel") scope.$eval(attrs[attr] + " = ''");
          }
          element.after(textInput);
          textInput[0].focus();
          textInput.bind("keydown keypress", e=>{
            if (e.which === 13) textInput[0].blur();
          });
          if (element.parent()[0].querySelector(".tip")) angular.element(element.parent()[0].querySelector(".tip")).remove();
          $timeout(()=>element.remove(), 10);
          $timeout($compile(textInput), 100, true, scope);
        }
      });
    }
  }
}])
/** Function for checking if a select element has a valid value */
.value("selectIsValid", arg=>arg && (typeof arg === "number" || arg.length) && arg !== "annet");
