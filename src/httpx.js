/* This service is an extension of the native AngularJS $http service  *
 *
 * This service provides more functionality, and serves the resource from localStorage if the server is unavailable
 *
 * The `get` method takes normal $http options, but also some more:
 * options.lifetime can be used to specify how many milliseconds the cached resource is valid
 * options.alt_urls can be used to specify alternative urls for the resource
 */
angular.module("httpx", ["crc32"]).service('httpx', ['$http', '$q', '$timeout', '$window', 'crc32', function($http, $q, $timeout, $window, crc32) {
  // Make this service an extension of $http
  let vm = angular.extend({}, $http);
  // Attempt to use indexedDB:
  try {
    !function(){function e(t,o){return n?void(n.transaction("s").objectStore("s").get(t).onsuccess=function(e){var t=e.target.result&&e.target.result.v||null;o(t)}):void setTimeout(function(){e(t,o)},100)}var t=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB;if(!t)return void console.error("indexDB not supported");var n,o={k:"",v:""},r=t.open("d2",1);r.onsuccess=function(e){n=this.result},r.onerror=function(e){console.error("indexedDB request error"),console.log(e)},r.onupgradeneeded=function(e){n=null;var t=e.target.result.createObjectStore("s",{keyPath:"k"});t.transaction.oncomplete=function(e){n=e.target.db}},window.ldb={get:e,set:function(e,t){o.k=e,o.v=t,n.transaction("s","readwrite").objectStore("s").put(o)}}}();
    vm.ldbOn = true;
  } catch (e) {
    console.warn("Unable to use lbd, using localStorage instead. Error:",e);
    vm.ldbOn = false;
  }
  vm.get = (url, options)=>{
    let resolved = false;
    let errors = 0;
    // Create a defer object which contains a promise
    const deferred = $q.defer();
    // Create options object if it does not already exist, and add necessary fields
    if (typeof options === "undefined") options = {};
    if (!("lifetime" in options)) options.lifetime = 0;
    // Create an array of urls
    if (typeof options.alt_urls === "string") options.alt_urls = [options.alt_urls];
    const urls = typeof options.alt_urls === "undefined" ? [url] : (options.alt_urls.push(url) && options.alt_urls);
    // Honor timeout if specified in options object
    const alt_timeout = options.timeout;
    // Create a canceler for the HTTP requests
    const canceler = $q.defer();
    deferred.promise.catch(canceler.resolve);
    options.timeout = canceler.promise;
    if (typeof alt_timeout === "number") $timeout(canceler.resolve, alt_timeout);
    else if (typeof alt_timeout !== "undefined") alt_timeout.catch(canceler.resolve);
    // If valid data is stored in localStorage, resolve the request using that data
    getFromStorage(urls[0], true, (stored_data, stored_data_is_valid)=>{
      if (stored_data_is_valid) {
        deferred.resolve(stored_data);
        resolved = true;
      } else {
        // Add the checksum of the stored data as a header to prevent the server from resending the same data
        options.headers = {"Content-Hash": crc32(JSON.stringify(stored_data ? stored_data.data : null))};
        // Loop through urls and make requests
        for (let i = 0;i < urls.length;i++) {
          options.withCredentials = urls[i].includes("bris-cdn.cf");
          $http.get(urls[i], options).then(function successCallback(response) {
            // Resolve with saved data if response from server was empty
            if (!resolved && response.status === 204) deferred.resolve(stored_data);
            // Resolve promise with data from request
            else if (!resolved) deferred.resolve(response);
            resolved = true;
            // Save new data to localStorage
            saveData(urls[0], response, Number(options.lifetime) + Date.now());
          }).catch(function errorCallback(response) {
            // Count error
            errors++;
            // If the request has not been resolved and all URL requests have failed, try to find data in localStorage even if it is not valid
            if (!resolved && errors === urls.length) {
              if (stored_data) {
                deferred.resolve(stored_data);
                resolved = true;
              } else {
                deferred.reject(response);
              }
            }
          });
        }
      }
    });
    return deferred.promise;
  };

  /**
   * Save a resource locally for later access
   * @param  {string}         url      Url to resource
   * @param  {any}            data     Data that should be saved
   * @param  {string|number}  lifetime The UNIX timestamp of expiry
   */
  function saveData(url, data, expiry) {
    if (vm.ldbOn) {
      try {
        $window.ldb.set(url, JSON.stringify(data));
        $window.ldb.set(url+"_expiry", expiry);
      } catch (ldbErr) {saveDataToLocalStorage(url, data, expiry, ldbErr)};
    } else saveDataToLocalStorage(url, data, expiry, "[none]");
  }
  function saveDataToLocalStorage(url, data, expiry, ldbErr) {
    try {
      $window.localStorage[url] = JSON.stringify(data);
      $window.localStorage[url+"_expiry"] = expiry;
    } catch (e) {console.log("Could not save",url,"to either indexedDB or localStorage. indexedDB-error:",ldbErr,"\nlocalStorage-error:",e)}
  }

  /**
   * Get saved data from storage
   * @param  {string}   url                 Url to the requested resource
   * @param  {boolean}  validness_required  Whether or not it is important that the resource is valid
   * @param  {function} callback            Callback function. Will receive the requested data or null if not found as first parameter, and whether or not the resource is valid as second.
   */
  function getFromStorage(url, validness_required, callback) {
    if (vm.ldbOn) {
      ldb.get(url+"_expiry", data=>{
        if (data !== null) {
          let valid = Number(data) > Date.now();
          if (!validness_required || valid) {
            ldb.get(url, data=>{
              if (data !== null) callback(JSON.parse(data), valid);
              else getFromLocalStorage(url, validness_required, callback);
            });
          } else getFromLocalStorage(url, validness_required, callback);
        } else getFromLocalStorage(url, validness_required, callback);
      });
    } else getFromLocalStorage(url, validness_required, callback);
  }

  /**
   * Get saved data from localStorage
   * [See documentation for getFromStorage for parameter explanation]
   */
  function getFromLocalStorage(url, validness_required, callback) {
    if ($window.Storage && url in $window.localStorage) {
      callback($window.localStorage[url], $window.localStorage[url+"_expiry"] > Date.now());
    } else if (validness_required) {
      getFromStorage(url, false, callback);
    } else if (Storage) {
      callback(null, false);
    }
  }

  return vm;
}]);
