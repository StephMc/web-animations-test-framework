/**
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 /**
 * Features: Just the menu bars and the page structure
 */

(function() {
// Boolean flag for in the program is running in automatiic mode
var runInAutoMode = true;

// How long it takes an individual test to timeout.
var testTimeout = 10000;
// How long it takes for the whole test system to timeout.
var frameworkTimeout = 20000;

// Call this function before setting up any checks.
// It generates the testing buttons and log and the testharness setup.
function setupTests(timeouts){
  // Use any user supplied timeouts
  for (var x in timeouts) {
    if (timeouts[x] == "frameworkTimeout") frameworkTimeout = timeouts[x];
    else if (timeouts[x] == "testTimeout") testTimeout = timeouts[x];
  }

  // Set up padding for option bar
  var padding = document.createElement('div');
  padding.id = "padding";
  document.body.appendChild(padding);

  // Generate options bar
  var optionBar = document.createElement('div');
  optionBar.id = "options";
  var select = document.createElement("select");
  select.setAttribute("id", "runType");
  var button = document.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("onclick", "restart()");
  button.innerHTML = "Restart";
  document.body.appendChild(optionBar);
  document.getElementById("options").appendChild(select);
  document.getElementById("options").appendChild(button);

  // Generate the log div
  var log = document.createElement('div');
  log.id = "log";
  document.getElementById("options").appendChild(log);

  // Set buttons
  select.options[select.options.length] =
      new Option('Manual Run', 'false');
  select.options[select.options.length] =
      new Option('Auto Run', 'true');
  setState(window.location.href.split("?")[1]);

  // Set the inital selected drop down list item
  select.selectedIndex = runInAutoMode;
  setup({ explicit_done: true, timeout: frameworkTimeout});
}

// Allows tutorial harness to edit runInAutoMode
function setState(newState){
  runInAutoMode = (newState == "true");
}

// Adds each test to a list to be processed when runTests is called.
function check(object, targets, time, message){
}

//Call this after lining up the tests with check
function runTests(){
}

function restart(){
  // State only gets updated on init and Restart button push.
  var runType = document.getElementById("runType");
  setState(runType.options[runType.selectedIndex].value);
  var url = window.location.href.split("?");
  window.location.href = url[0] + "?" + runInAutoMode;
}

///////////////////////////////////////////////////////////////////////////////
//  Exposing functions to be accessed externally                             //
///////////////////////////////////////////////////////////////////////////////
window.setupTests = setupTests;
window.check = check;
window.runTests = runTests;
window.restart = restart;
window.setState = setState;
})();