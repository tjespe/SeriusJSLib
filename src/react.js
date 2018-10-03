/**
 * Module for using react with AngularJS
 */
angular.module("react", [])
/**
 * Handle components
 * @param  {string}   componentName (Optional) The name of the component that should be added or retrieved
 * @param  {function} newComponent  (Optional) The component that should be added
 * @return {Object}                 The added component if one was added, else the retrieved component if one was requested, else all components
 */
.service("reactComponents", [function () {
  const components = {};
  return function (componentName, newComponent) {
    if (typeof componentName === "string" && typeof newComponent !== "undefined") {
      return components[componentName] = newComponent;
    } else if (typeof componentName === "string") {
      return components[componentName];
    }
    return components;
  };
}])
/**
 * This directive makes it possible to render react components.
 * In order to make this work, you need to set the HTML attribute "component" to the name of the react component (must correspond to the one used when adding the component to the service above).
 * If you want to send props to your react component you can add custom HTML attributes, but prefix them with "prop-" (the values will be evaluated as AngularJS expressions before they are sent as props).
 * if you add something to the HTML attribute "post-render" it will be evaluated in scope after the react component is rendered.
 */
.directive("react", ["$compile", "$window", "reactComponents", function ($compile, $window, reactComponents) {
  const props = {};
  const prefix = key=>"prop"+key[0].toUpperCase()+key.slice(1);
  const unprefix = key=>key.replace(/^prop(.)/, (str, c)=>c.toLowerCase());
  $window.searchFn = ()=>props.searchFn;
  return {
    compile: function (el, attrs) {
      Object.keys(attrs).filter(attr=>attr.startsWith("prop")).forEach(key=>props[unprefix(key)] = null);
      return function (scope, el, attrs) {
        props.$scope = scope;
        Object.keys(props).forEach(key=>props[key] = scope.$eval(attrs[prefix(key)]));
        const Component = reactComponents(attrs.component);
        $window.ReactDOM.render($window.React.createElement(Component, props, null), el[0]);
        if ("postRender" in attrs) scope.$eval(attrs.postRender);
      };
    }
  };
}]);
