/** Module for validating events */
angular.module("events", [])
/** Check if an event was a "click" */
.value("isClick", e=>e.type === "click" || (e.type === "keypress" && ([32,13].includes(e.keyCode || e.charCode))));