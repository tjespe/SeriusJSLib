/**
 * Kind of a "lite ng-route system"
 * Usage:
 *   1. Create an angular module called "tabConfig", with a value called tabConfig.
 *      This value should be an array of arrays where each subarray consists of three elements: a title (string or function), a template (string), and an indicator (string, will be used in url) respectively.
 *      If the template string is prefixed by "url:" it will be treated as a URL, otherwise it will be treated as HTML code.
 *   
 *   2. Use tabs.setTab in any scope to change tab (the argument should be the path of the tab to which you want to change)
 *
 * Additional features:
 *   - The current tab can be refreshed and recompiled by calling tabs.refreshTab() in any scope
 *   - A description for the current tab is available as tabs.getTabDescription() in any scope
 *   - The configuration is available as tabs.getTabsConfig() in any scope
 *   - When changing to tab with index n, the nth children of all elements with the HTML attribute "tabs" will be given the class "active"
 */
angular.module("tabs", ["tabConfig", "httpx", "selectors"])
.service("tabService", ["$location", "$rootScope", "$templateCache", "$timeout", "httpx", "tabConfig", function ($location, $rootScope, $templateCache, $timeout, httpx, tabConfig) {
  const path = ()=>$location.path().slice(1);
  let pub = {}; // This object will be available as "tabs" in any scope
  tabConfig[-1] = ["Laster inn...", "<!-- Loading -->", "loading"]; // Add a dummy tab for loading
  /** @type {Array} The current tab (one of the arrays in tabConfig) */
  let tab = tabConfig[-1]; // Set tab to loading tab

  /**
   * @return {number} The index of the current tab
   */
  pub.getTab = ()=>tabConfig.indexOf(tab);
  /**
   * @return {string} The HTML string template for the current tab
   */
  pub.getTabTemplate = ()=>tab ? $templateCache.get(tab[2]) : "<!-- Loading -->";
  /**
   * @return {string} The description for the current tab
   */
  pub.getTabDescription = ()=>tab ? typeof tab[0] === "function" ? tab[0]() : tab[0] : "";
  /**
   * Change tab
   * @param  {string} url (Optional) The path representing the current tab. If not supplied: the current path or the first tab will be used.
   */
  pub.setTab = url=>{
    const obj = url || path() ? tabConfig.find(tab=>tab[2] === (url || path())) : tabConfig[0];
    url = obj[2];
    if (!$templateCache.get(url)) {
      if (/^url:/.test(obj[1])) httpx.get(obj[1].slice(4)).then(resp=>$templateCache.put(url, resp.data));
      else $templateCache.put(url, obj[1]);
    }
    $location.path(url);
    tab = obj;
  };
  /**
   * Briefly replaces current tab with loading screen
   */
  pub.refreshTab = ()=>{
    [tab, oldTab] = [tabConfig[-1], tab];
    $timeout(()=>tab = oldTab, 0);
  };
  /**
   * @return {Array} Returns all the tab configuration
   */
  pub.getTabsConfig = ()=>tabConfig;

  pub.setTab();
  $rootScope.$watch(path, pub.setTab); // Make sure tab changes when path does

  $rootScope.tabs = pub;
  return pub;
}])
.directive("tabView", ["$compile", "tabService", function ($compile, tabService) {
  return {
    link: function (scope, el, attrs) {
      scope.$watch(tabService.getTabTemplate, template=>{
        el.children().remove();
        el.append($compile(template)(scope));
      });
    }
  };
}])
/**
 * Controller for hiding and showing navigation menu
 */
.controller("navCtrl", ["$timeout", "$scope", "tabService", function ($timeout, $scope, tabService) {
  let vm = this;
  vm.navIsShown = false;
  vm.showNav = ()=>$timeout(()=>vm.navIsShown = true, 0);
  vm.setTab = url=>{
    tabService.setTab(url);
    $timeout(()=>vm.navIsShown = false, 500);
  };
  angular.element(document).bind("click touchstart", e=>{
    if (vm.navIsShown) {
      if (e.path.hasObjWithPropVal("tagName", "NAV")) $timeout(()=>vm.navIsShown = false, 500);
      else $timeout(()=>vm.navIsShown = false, 10);
    }
  });
}])
/**
 * Directive for toggling "active"-class on navigation elements
 */
.directive("tabs", ["tabService", function (tabService) {
  return {
    link: function (scope, el) {
      scope.$watch(tabService.getTab, i=>{
        el.children().removeClass("active");
        if (i < el.children().length && i > -1) el.children()[i].classList.add("active");
      })
    }
  };
}]);