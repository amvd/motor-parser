/* global $:false, sampleJson:false */

"use strict";

$(document).ready(function() {
  $("#submit-button").click(parseInput)

  $("body").on("click", ".hide-button", function(e) {
    const $target = $(e.target);
    const $parent = $target.parent().parent();
    const $list = $("ol.expandable-list", $parent);

    $list.toggle()
  })

  function parseInput() {
    const $input = $("#input-box");
    const inputText = $input.val();
    if (inputText.length === 0) {
      alert("You need to paste the motor data into the box first, Ben.")
      return
    }
    try {
      var maintenance = JSON.parse(inputText);
    } catch (err) {
      alert(`You didn't enter proper JSON. Error Msg: ${err}`)
      return
    }

    const body = maintenance.Body;
    const applications = body.Applications;
    const intervals = body.Intervals;

    let responseString = "";

    const intervalMap = {};

    for (let i = 0, L = intervals.length; i < L; i++) {
      const interval = intervals[i];
      const intervalApps = interval.Applications;

      const intervalArray = intervalMap[interval.Interval] = intervalMap[interval.Interval] || [];

      for (let j = 0, jL = intervalApps.length; j < jL; j++) {
        const appIndex = applications.findIndex((a) => {
          const maintenanceMatch = a.Items.findIndex((item) => item.MaintenanceScheduleID == intervalApps[j].MaintenanceScheduleID);
          return a.ApplicationID == intervalApps[j].ApplicationID && maintenanceMatch > -1
        });

        if (appIndex > -1) {
 intervalArray.push(applications[appIndex])
}
      }

      console.log(`Array for interval ${interval}:`, intervalArray)
    }

    for (const interval in intervalMap) {
      const inspections = [];
      const services = [];
      const tests = [];
      const applications = intervalMap[interval];
      console.log(`Apps for interval ${interval}:`, applications)

      for (var i = 0, L = applications.length; i < L; i++) {
        const application = applications[i];
        const taxonomy = application.Taxonomy;
        if (taxonomy.Action === "Inspect") {
          inspections.push(application)
        } else if (taxonomy.Action === "Test") {
          tests.push(application)
        } else {
          services.push(application)
        }
      }

      responseString += `<h1>Interval: ${interval} Miles</h1>`;

      responseString += listServicesFor("services", services);
      responseString += listServicesFor("tests", tests);
      responseString += listServicesFor("inspections", inspections);
    }

    $("#results-box").html(responseString)
  }

  function listServicesFor(type, typeArray) {
        console.log(
      `\n${type.toUpperCase()} (${typeArray.length}):`
    )
    let responseString = "";

    responseString += `<div class="${type}">
    <h3>
      ${type.toUpperCase()} (${typeArray.length})
      <button class="hide-button">Show/Hide</button>
    </h3>
    <ol class="${type}-list list expandable-list">`;
    for (var i = 0, L = typeArray.length; i < L; i++) {
      console.log(`- ${typeArray[i]}`)
      const application = typeArray[i];
      const taxonomy = application.Taxonomy;
      const labor = application.EstimatedWorkTimes.filter((item) => item.IsActive)[0];
      const item = application.Items.filter((item) => item.IsActive)[0];
      responseString +=
        `<li>
          <p><b>Name:</b> ${taxonomy.LiteralName}</p>
          <p><b>Action:</b> ${taxonomy.Action}</p>
          <p><b>Labor Time:</b> ${labor.BaseLaborTime} ${labor.LaborTimeInterval}</p>
          <p><b>Severe Service:</b> ${item.SevereServiceDescription}</p>
          <p><b>Indicator-based:</b> ${item.Indicator.length > 0 ? item.Indicator : false}</p>
          <p><b>Frequency:</b> ${item.FrequencyDescription}
          <ul>
            <li><b>Miles:</b> ${item.IntervalMile}</li>
            <li><b>Months:</b> ${item.IntervalMonth}</li>
            <li><b>Operating Hours:</b> ${item.IntervalOperatingHours}</li>
          </ul>
        </li>`
      ;
    }
    responseString += `</ol></div>`;

    return responseString;
  }

  $("#input-box").val(JSON.stringify(sampleJson))
})

// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value(predicate) {
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