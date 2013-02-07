/*
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

(function() {
var pass;
var completedTests;
var allDone;
var numTests;

// Call to initialize the testing environment.
function setupTutorialTests() {
  setState("Manual");
  var timeOfAnimation = document.createElement('div');
  timeOfAnimation.id = "animViewerText";
  timeOfAnimation.innerHTML = "Current animation time: 0.00";
  document.body.appendChild(timeOfAnimation);
  numTests = 0;
  completedTests = 0;
  allDone = false;
  pass = true;
}

// Create an async_test that emulates testharness.js.
function async_test(func, name, properties) {
  numTests++;
  step = function(func, this_obj) {
    func();
    if (!pass) {
        console.log("FAIL :(");
        parent.display.fail();
        allDone = true;
    }
  } 

  done = function() {
    completedTests++;
    if(completedTests == numTests && !allDone) {
        console.log("PASS :D");
        allDone = true;
        parent.display.pass();
    }
  }
  return this;
}   

function assert_equals(actual, expected, description) {
  console.log("in equals");
  pass = (actual == expected);
}

function assert_approx_equals(actual, expected, epsilon, description) {
  console.log("in approx equals");
  var lowerBound = expected - (epsilon / 2) < actual;
  var upperBound = expected + (epsilon / 2) > actual;
  pass = (lowerBound && upperBound);
}

// Required function for extra-asserts.js.
function add_completion_callback(anything) {
}

///////////////////////////////////////////////////////////////////////////////
//  Exposing functions to be accessed externally                             //
///////////////////////////////////////////////////////////////////////////////

window.setupTutorialTests = setupTutorialTests;
window.async_test = async_test;
window.assert_approx_equals = assert_approx_equals;
window.assert_equals = assert_equals;
window.add_completion_callback = add_completion_callback;
})();