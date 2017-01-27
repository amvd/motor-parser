/* global $:false, sampleJson:false */

"use strict";

$(document).ready(function () {
  $("#submit-button").click(parseInput);

  $("body").on("click", ".hide-button", function (e) {
    var $target = $(e.target);
    var $parent = $target.parent().parent();
    var $list = $("ol.expandable-list", $parent);

    $list.toggle();
  });

  function parseInput() {
    var $input = $("#input-box");
    var inputText = $input.val();
    if (inputText.length === 0) {
      alert("You need to paste the motor data into the box first, Ben.");
      return;
    }
    try {
      var maintenance = JSON.parse(inputText);
    } catch (err) {
      alert("You didn't enter proper JSON. Error Msg: " + err);
      return;
    }

    var body = maintenance.Body;
    var applications = body.Applications;
    var intervals = body.Intervals;

    var responseString = "";

    var intervalMap = {};

    var _loop = function _loop(_i, _L) {
      var interval = intervals[_i];
      var intervalApps = interval.Applications;

      var intervalArray = intervalMap[interval.Interval] = intervalMap[interval.Interval] || [];

      var _loop2 = function _loop2(j, jL) {
        var appIndex = applications.findIndex(function (a) {
          var maintenanceMatch = a.Items.findIndex(function (item) {
            return item.MaintenanceScheduleID == intervalApps[j].MaintenanceScheduleID;
          });
          return a.ApplicationID == intervalApps[j].ApplicationID && maintenanceMatch > -1;
        });

        if (appIndex > -1) {
          intervalArray.push(applications[appIndex]);
        }
      };

      for (var j = 0, jL = intervalApps.length; j < jL; j++) {
        _loop2(j, jL);
      }

      console.log("Array for interval " + interval + ":", intervalArray);
    };

    for (var _i = 0, _L = intervals.length; _i < _L; _i++) {
      _loop(_i, _L);
    }

    for (var interval in intervalMap) {
      var inspections = [];
      var services = [];
      var tests = [];
      var _applications = intervalMap[interval];
      console.log("Apps for interval " + interval + ":", _applications);

      for (var i = 0, L = _applications.length; i < L; i++) {
        var application = _applications[i];
        var taxonomy = application.Taxonomy;
        if (taxonomy.Action === "Inspect") {
          inspections.push(application);
        } else if (taxonomy.Action === "Test") {
          tests.push(application);
        } else {
          services.push(application);
        }
      }

      responseString += "<h1>Interval: " + interval + " Miles</h1>";

      responseString += listServicesFor("services", services);
      responseString += listServicesFor("tests", tests);
      responseString += listServicesFor("inspections", inspections);
    }

    $("#results-box").html(responseString);
  }

  function listServicesFor(type, typeArray) {
    console.log("\n" + type.toUpperCase() + " (" + typeArray.length + "):");
    var responseString = "";

    responseString += "<div class=\"" + type + "\">\n    <h3>\n      " + type.toUpperCase() + " (" + typeArray.length + ")\n      <button class=\"hide-button\">Show/Hide</button>\n    </h3>\n    <ol class=\"" + type + "-list list expandable-list\">";
    for (var i = 0, L = typeArray.length; i < L; i++) {
      console.log("- " + typeArray[i]);
      var application = typeArray[i];
      var taxonomy = application.Taxonomy;
      var labor = application.EstimatedWorkTimes.filter(function (item) {
        return item.IsActive;
      })[0];
      var item = application.Items.filter(function (item) {
        return item.IsActive;
      })[0];
      responseString += "<li>\n          <p><b>Name:</b> " + taxonomy.LiteralName + "</p>\n          <p><b>Action:</b> " + taxonomy.Action + "</p>\n          <p><b>Labor Time:</b> " + labor.BaseLaborTime + " " + labor.LaborTimeInterval + "</p>\n          <p><b>Severe Service:</b> " + item.SevereServiceDescription + "</p>\n          <p><b>Indicator-based:</b> " + (item.Indicator.length > 0 ? item.Indicator : false) + "</p>\n          <p><b>Frequency:</b> " + item.FrequencyDescription + "\n          <ul>\n            <li><b>Miles:</b> " + item.IntervalMile + "</li>\n            <li><b>Months:</b> " + item.IntervalMonth + "</li>\n            <li><b>Operating Hours:</b> " + item.IntervalOperatingHours + "</li>\n          </ul>\n        </li>";
    }
    responseString += "</ol></div>";

    return responseString;
  }

  $("#input-box").val(JSON.stringify(sampleJson));
});

// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function value(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    }
  });
}