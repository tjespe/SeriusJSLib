/**
 * Kind of a "lite ng-route system"
 * Usage:
 *   1. Create an angular module called "tabConfig", with a value called tabConfig.
 *      This value should be an array of arrays where each sub array consists of two strings: a title, and a template, respectively.
 *      If the template string is prefixed by "url:" it will be treated as a URL, otherwise it will be treated as HTML code.
 *   
 *   2. Use tabs.setTab(n) in any scope to change tab
 *
 * Additional features:
 *   - The current tab can be refreshed and recompiled by calling tabs.refreshTab() in any scope
 *   - A description for the current tab is available as tabs.getTabDescription() in any scope
 *   - The configuration is available as tabs.getTabsConfig() in any scope
 *   - When changing to tab n, the nth element of all 'nav' elements will be given the class "active"
 */
angular.module("tabs", ["tabConfig"])
.service("tabService", ["$http", "$location", "$rootScope", "$templateCache", "$timeout", "q", "qa", "tabConfig", function ($http, $location, $rootScope, $templateCache, $timeout, q, qa, tabConfig) {
  let pub = {}; // This object will be available as "tabs" in any scope
  let tab = Number($location.path().slice(1));
  tabConfig[-1] = ["Laster inn...", "<!-- Loading -->"];

  pub.getTab = ()=>tab;
  pub.getTabTemplate = ()=>$templateCache.get(tab);
  pub.getTabDescription = ()=>tabConfig[tab][0];
  pub.setTab = n=>{
    if (!$templateCache.get(n)) {
      if (/^url:/.test(tabConfig[n][1])) $http.get(tabConfig[n][1].slice(4)).then(resp=>$templateCache.put(n, resp.data));
      else $templateCache.put(n, tabConfig[n][1]);
    }
    $location.path(n);
    tab = n;
    qa("nav").children().removeClass("active");
    qa("nav").forEach(nav=>n < nav.children.length && n > -1 ? nav.children[n].classList.add("active") : null);
  };
  pub.refreshTab = ()=>{
    [tab, oldTab] = [-1, tab];
    $timeout(()=>tab = oldTab, 0);
  };
  pub.getTabsConfig = ()=>tabConfig;

  $rootScope.$watch(()=>$location.path(), ()=>pub.setTab(Number($location.path().slice(1))));

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
.controller("navCtrl", ["$timeout", "$rootScope", "tabService", function ($timeout, $rootScope, tabService) {
  let vm = this;
  vm.navIsShown = false;
  vm.showNav = ()=>$timeout(()=>vm.navIsShown = true, 0);
  vm.setTab = n=>{
    tabService.setTab(n);
    $timeout(()=>vm.navIsShown = false, 500);
  }
  angular.element(document).bind("click touchstart", e=>{
    if (vm.navIsShown) {
      if (e.path.hasObjWithPropVal("tagName", "NAV")) $timeout(()=>vm.navIsShown = false, 500);
      else $timeout(()=>vm.navIsShown = false, 10);
    }
  });
}]);
