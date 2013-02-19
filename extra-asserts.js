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
 /*TODO:
  - Change the pause method for flashing so it doesn't rely on par groups.
    This requires the ability to either globally pause or check if a
    animation is currently playing
 */

(function() {
// For the results to be accessed when test is in an iframe.
var testResults = undefined;
// The parGroup all animations need to be added to to achieve 'global' pause
var parentAnimation;
// To keep track of what the dropdown list state is.
var runType;
// The current run type of the animation.
var state = "Auto";
// Holds which test packet we are up to.
var testIndex = 0;
//Each index holds all the tests that occur at the same time
var testPacket = [];

// How long to show each manual check for.
var pauseTime = 1000;
// How long it takes an individual test to timeout.
var testTimeout = 2000000;
// How long it takes for the whole test system to timeout.
var frameworkTimeout = 2000000;
// The default error margin if none is specified
// It's currently 12 as it works well with most average speed animations
var defaultEpsilon = 0;
// The time between each frame render in seconds
var framePeriod = 0.016;
// Stops tests being triggered when the user is scrubbing
var scrubbing = false;


// To get user pausing working correctly
var beingPaused = 0;
var userPaused = false;

function testRecord(test, object, targets, time, message, cssStyle,
                    offsets, isRefTest){
  this.test = test;
  this.object = object;
  this.targets = targets;
  this.time = time;
  this.message = message;
  this.cssStyle = cssStyle;
  this.offsets = offsets;
  this.isRefTest = isRefTest;
  // Stops test being re-asserted during replay
  this.complete = false;
}

// Call this function before setting up any checks.
// It generates the testing buttons and log and the testharness setup.
function setupTests(timeouts){
  // Use any user stated timeouts
  for (var x in timeouts) {
    if (timeouts[x] == "frameworkTimeout") frameworkTimeout = timeouts[x];
    else if (timeouts[x] == "testTimeout") testTimeout = timeouts[x];
  }

  // Set up padding for option bar
  var padding = document.createElement('div');
  padding.id = "padding";
  padding.className = "testBox";
  document.body.appendChild(padding);

  // Generate options bar
  var optionBar = document.createElement('div');
  optionBar.id = "options";

  var timeBar = document.createElement('div');
  timeBar.id = "timeBar";
  timeBar.addEventListener('mousedown', startSlide, false);
  timeBar.addEventListener('mouseup', stopSlide, false);
  var slider = document.createElement('div');
  slider.id = "slider";

  var select = document.createElement("select");
  select.setAttribute("id", "runType");
  var hideFlash = document.createElement("button");
  hideFlash.setAttribute("type", "button");
  hideFlash.setAttribute("onclick", "toggleFlash()");
  hideFlash.innerHTML = "Toggle Flash";
  var button = document.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("onclick", "restart()");
  button.innerHTML = "Restart";
  var timeOfAnimation = document.createElement('div');
  timeOfAnimation.id = "animViewerText";
  timeOfAnimation.innerHTML = "Current animation time: 0.00";
  document.body.appendChild(optionBar);
  optionBar.appendChild(timeBar);
  timeBar.appendChild(slider);
  optionBar.appendChild(select);
  optionBar.appendChild(button);
  optionBar.appendChild(hideFlash);
  optionBar.appendChild(timeOfAnimation);

  // Generate the log div
  var log = document.createElement('div');
  log.id = "log";
  document.getElementById("options").appendChild(log);

  // Set buttons
  runType = document.getElementById("runType");
  runType.options[runType.options.length] =
      new Option('Auto Run', 'Auto');
  runType.options[runType.options.length] =
      new Option('Manual Run', 'Manual');
  setState(window.location.href.split("?")[1]);

  // Initalse state and setup
  if (state == "Manual") runType.selectedIndex = 1;
  else {
    state = "Auto";
    runType.selectedIndex = 0;
  }

  // Create copy of the test div to show flashing correctly
  var testBoxCopy = document.createElement('div');
  testBoxCopy.id = "flashBox";
  testBoxCopy.className = "testBox";
  document.body.appendChild(testBoxCopy);
  var svgBox = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgBox.id = "svgBox";
  testBoxCopy.appendChild(svgBox);
  // Setup the pause animation function
  testBoxCopy.setAttribute("onclick", "animPause()");
  setup({ explicit_done: true, timeout: frameworkTimeout});
}

function startSlide(event){
  scrubbing = true;
  var bar = document.getElementById("timeBar");
  beingPaused++;
  parentAnimation.pause();
  var setPercent = ((((event.clientX - bar.offsetLeft) / bar.offsetWidth)).toFixed(2));
  bar.addEventListener('mousemove', moveSlide, false);
  document.getElementById("slider").style.width = (setPercent * 100) + '%';
  parentAnimation.currentTime = setPercent * parentAnimation.animationDuration;
}

function moveSlide(event){
  var bar = document.getElementById("timeBar");
  var setPercent = ((((event.clientX - bar.offsetLeft) / bar.offsetWidth)).toFixed(2));
  document.getElementById("slider").style.width = (setPercent * 100) + '%';
  parentAnimation.currentTime = setPercent * parentAnimation.animationDuration;
}

function stopSlide(event){
  if(scrubbing){
    var bar = document.getElementById("timeBar");
    var setPercent = ((((event.clientX - bar.offsetLeft) / bar.offsetWidth)).toFixed(2));
    bar.removeEventListener('mousemove', moveSlide, false);
    document.getElementById("slider").style.width = (setPercent * 100) + '%';
    parentAnimation.currentTime = setPercent * parentAnimation.animationDuration;
    // Move testIndex to the right location
    // This not only re runs flashes that already have been played but also
    // stop flashes that have been skipped not to show
    for (testIndex = 0; testPacket[testIndex][0].time < parentAnimation.iterationTime &&
        testIndex < testPacket.length; testIndex++);

    beingPaused--;
    if(beingPaused == 0) parentAnimation.play();
    scrubbing = false;
  }
}

// Allows tutorial harness to edit state
function setState(newState){
  state = newState;
}

// Adds each test to a list to be processed when runTests is called.
function check(object, targets, time, message){
  if(testPacket.length == 0) reparent();
  // Create new async test
  var test = async_test(message);
  test.timeout_length = testTimeout;

  // Store the inital css style of the animated object so it can be
  // used for manual flashing.
  var css = object.currentStyle || getComputedStyle(object, null);
  var offsets = [];
  offsets["top"] = getOffset(object).top - parseInt(css.top);
  offsets["left"] = getOffset(object).left- parseInt(css.left);
  if (targets.refTest == true){
    var maxTime = document.animationTimeline.children[0].animationDuration;
    // Generate a test for each time you want to check the objects.
    for (var x = 0; x < maxTime/time; x++){
      var temp = new testRecord(test, object, targets, time * x, "Property "
          + targets + " is not satisfied", css, offsets, true);
      testPacket.push(temp);
    }
    var temp = new testRecord(test, object, targets, time * x, "Property "
        + targets + " is not satisfied", css, offsets, "Last refTest");
    testPacket.push(temp);
  } else testPacket.push(new testRecord(test, object, targets, time, "Property "
        + targets + " is not satisfied", css, offsets, false));
}

// Helper function which gets the current absolute position of an object.
// From http://tiny.cc/vpbtrw
function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

// Put all the animations into a par group to get around global pause issue.
function reparent(){
  var childList = [];
  for (var i = 0; i < document.animationTimeline.children.length; i++) {
    childList.push(document.animationTimeline.children[i]);
  }
  parentAnimation = new ParGroup(childList);
}

//Call this after lining up the tests with check
function runTests(){
  if (testPacket.length == 0) reparent();
  animTimeViewer();
  sortTests();
  if (state == "Manual") testRunner();
  else {
    parentAnimation.pause();
    autoTestRunner();
  }
}

function animTimeViewer(){
  var currTime = document.animationTimeline.children[0].iterationTime;
  if (currTime != null) currTime = currTime.toFixed(2);
  else currTime = 0.00;
  var object = document.getElementById("animViewerText");
  object.innerHTML = "Current animation time " + currTime;
  var slider = document.getElementById("slider");
  slider.style.width = (currTime / parentAnimation.animationDuration) * 100 + "%";
  window.webkitRequestAnimationFrame(function(){ animTimeViewer(); });
}

function sortTests(){
  // Sort tests by time to set up timeouts properly
  var tempStack = testPacket;
  testPacket = [];
  tempStack.sort(testTimeSort);
  for (var x = 0; x < tempStack.length; x++){
    // Check for all tests that happen at the same time
    // and add them to the test packet.
    testPacket[testIndex] = [];
    testPacket[testIndex].push(tempStack[x]);
    while (x < (tempStack.length - 1)){
      if (tempStack[x].time == tempStack[x + 1].time){
        x++;
        testPacket[testIndex].push(tempStack[x]);
      } else break;
    }
    testIndex++;
  }
  testIndex = 0;
}

function testTimeSort(a,b) { return(a.time - b.time) };

function testRunner(index){
  var currTest = testPacket[testIndex][0];
  var animLength = parentAnimation.animationDuration;
  var stopTestRunner = false;
  if (currTest.time > animLength) currTest.time = animLength;
  // Forces the frame closest to the test to be exactly the test time
  if(!scrubbing){
    if (currTest.time < parentAnimation.iterationTime + framePeriod){
      parentAnimation.currentTime = currTest.time;
      beingPaused++;
      parentAnimation.pause();
      window.webkitRequestAnimationFrame(function(){runManualTest();});
      // We've just scheduled the last test so kill the testRunner
      if(testIndex == testPacket.length - 1) stopTestRunner = true;
    }
  }
  if (testIndex < testPacket.length && !stopTestRunner){
      window.webkitRequestAnimationFrame(function(){testRunner(index);});
  }
}

function runManualTest(){
  for (var i = 0; i < testPacket[testIndex].length; i++){
    var currTest = testPacket[testIndex][i];
    if(!test.complete){
      assert_properties(currTest);
      if(currTest.isRefTest == "Last refTest" || currTest.isRefTest == false){
        currTest.test.done();
      }
    }
    if(currTest.isRefTest == false) flashing(currTest);
  }
  testIndex++;
  beingPaused--;
  if(beingPaused == 0) parentAnimation.play();
  if(testIndex == testPacket.length) done();
}

function autoTestRunner(){
  if (testIndex != 0 && testIndex < testPacket.length + 1){
    for (var x in testPacket[testIndex - 1]){
      var currTest = testPacket[testIndex - 1][x];
      assert_properties(currTest);
      if (currTest.isRefTest == false || currTest.isRefTest == "Last refTest"){
        currTest.test.done();
      }
    }
  }
  if (testIndex < testPacket.length){
    var nextTest = testPacket[testIndex][0];
    document.animationTimeline.children[0].currentTime = nextTest.time;
    testIndex++;
    window.webkitRequestAnimationFrame(function(){ autoTestRunner(); });
  } else {
    parentAnimation.pause();
    done();
  }
}

function restart(){
  // State only gets updated on init and Restart button push.
  setState(runType.options[runType.selectedIndex].value);
  var url = window.location.href.split("?");
  window.location.href = url[0] + "?" + state;
}

// Makes it easier to see whats going on in the test.
function animPause(){
  if(state == "Manual"){
    if (userPaused){
      beingPaused--;
      if (beingPaused == 0){
        if (document.animationTimeline.children[0].iterationTime
          < document.animationTimeline.children[0].animationDuration - 0.01){
          parentAnimation.play();
        }
      }
      userPaused = false;
      document.getElementById("test").style.backgroundColor = "white";
    } else {
      beingPaused++;
      parentAnimation.pause();
      userPaused = true;
      document.getElementById("test").style.backgroundColor = "yellow";
    }
  }
}

// Create elements at appropriate locations and flash the elements for
// manual testing.
function flashing(test) {
  beingPaused++;
  parentAnimation.pause();
  var type = test.object.nodeName;

  // Create a new object of the same type as the thing being tested.
  if (type == "DIV") {
    var flash = document.createElement('div');
    document.getElementById("flashBox").appendChild(flash);
  } else {
    var flash = document.createElementNS("http://www.w3.org/2000/svg", type);
    document.getElementById("svgBox").appendChild(flash);
  }

  if(type == "DIV") {
    // Copy the objects orginal css style
    flash.style.cssText = test.cssStyle.cssText;
    flash.style.position = "absolute";
    flash.innerHTML = test.object.innerHTML;
    flash.className = "flash";
  } else {
    for (var x = 0; x < test.object.attributes.length; x++){
      flash.setAttribute(test.object.attributes[x].name,
                         test.object.attributes[x].value);
    }
    flash.style.position = test.object.parentNode.style.position;
  }

  var seenTop = false;
  var seenLeft = false;
  for (var propName in test.targets) {
    var tar = test.targets[propName];
    if (propName == "left") seenLeft = true;
    else if (propName == "top") seenTop = true;
    if (type == "DIV"){
      flash.style[propName] = tar;
    } else {
      if (propName.indexOf("transform") != -1) propName = "transform";
      flash.setAttribute(propName, tar);
    }
  }

  if (type == "DIV") {
    if (!seenTop){
      flash.style.top = getOffset(test.object).top + "px";
    }
    if (!seenLeft) {
      flash.style.left = getOffset(test.object).left + "px";
    }
  }

  //Set up the border
  if (type == "DIV"){
    flash.style.borderColor = 'black';
    flash.style.borderWidth = '3px';
    flash.style.borderStyle = 'solid';
    flash.style.opacity = 1;
  } else {
    flash.setAttribute("stroke", "black");
    flash.setAttribute("stroke-width", "3px");
    flash.setAttribute("fill-opacity", 1);
  }

  flashCleanUp(flash);
}

function flashCleanUp(victim){
  setTimeout(function() {
    if(userPaused && !scrubbing){
      // Since the user has paused, keep any displayed divs up and set new timeout
      flashCleanUp(victim);
    } else {
      victim.parentNode.removeChild(victim);
      if (document.animationTimeline.children[0].iterationTime
          < document.animationTimeline.children[0].animationDuration - 0.01){
        beingPaused--;
        if(beingPaused == 0) parentAnimation.play();
      }
    }
  }, pauseTime);
}

function toggleFlash(){
  var allFlash = [];
  var elements = document.getElementById("svgBox").childNodes;
  for(var i = 0; i < elements.length; i++) allFlash.push(elements[i]);
  elements = document.getElementsByClassName("flash");
  for(var i = 0; i < elements.length; i++) allFlash.push(elements[i]);

  for(var i in allFlash){
    var type = allFlash[i].nodeName;
    if(type == "DIV"){
      if (allFlash[i].style.display == 'block'){
        allFlash[i].style.display = 'none';
      } else {
        allFlash[i].style.display = 'block';
      }
    } else {
      if (allFlash[i].getAttribute("fill-opacity") == 1){
        allFlash[i].setAttribute("fill-opacity", 0);
        allFlash[i].setAttribute("stroke-width", "0px");
      } else {
        allFlash[i].setAttribute("fill-opacity", 1);
        allFlash[i].setAttribute("stroke-width", "3px");
      }
    }
  }
}

add_completion_callback(function (allRes, status) {
    testResults = allRes;
    window.testResults = testResults;
});

///////////////////////////////////////////////////////////////////////////////
//  All asserts below here                                                   //
///////////////////////////////////////////////////////////////////////////////
function assert_properties(test){
  var object = test.object;
  var targets = test.targets;
  var message = test.message;
  var time = document.animationTimeline.children[0].iterationTime;
  if (time == null) time = 0;

  var isSVG = (object.nodeName != "DIV");
  var tempOb = isSVG ? document.createElementNS("http://www.w3.org/2000/svg",
      object.nodeName) : document.createElement(object.nodeName);
  tempOb.style.position = "absolute";
  object.parentNode.appendChild(tempOb);

  for (var propName in targets){
    if (targets[propName].nodeName != undefined){
      var tar = (targets[propName].currentStyle ||
                 getComputedStyle(targets[propName], null))[propName];
    } else var tar = targets[propName];
    if (isSVG){
      if (propName.indexOf("transform") == -1){
        tempOb.setAttribute(propName, tar);
      }
    } else tempOb.style[propName] = tar;
  }

  if (isSVG){
    var compS = object.attributes;
    var tempS = tempOb.attributes;
  } else {
    var compS = object.currentStyle || getComputedStyle(object, null);
    var tempS = tempOb.currentStyle || getComputedStyle(tempOb, null);
  }
  for (var propName in targets){
    if (propName != "refTest"){
      if (isSVG && propName.indexOf("transform") != -1){
        assert_transform(object, targets[propName], message);
      } else {
        if (isSVG){
          var tar = tempS[propName].value;
          var curr = compS[propName].value;
        } else {
          var tar = tempS[propName];
          var curr = compS[propName];
        }

        var t = tar.replace(/[^0-9.\s]/g, "");
        var c = curr.replace(/[^0-9.\s]/g, "");
        if(t.length == 0) {
          // Assume it's a word property so do an exact assert
          test.test.step(function (){
            assert_equals(curr, tar, "At time " + time + ", " + propName +
                " is not correct. Target: " + tar + " Current state: " + curr);
          });
        } else {
          t = t.split(" ");
          c = c.split(" ");
          for (var x in t){
            test.test.step(function (){
              assert_equals(Number(c[x]), Number(t[x]), "At time " + time + ", " + propName +
                  " is not correct. Target: " + tar + " Current state: " + curr);
            });
          }
        }
      }
    }
  }
  tempOb.parentNode.removeChild(tempOb);
  test.complete = true;
}

// Deals with the svg transforms special case.
function assert_transform(object, target, message){
  var currStyle = object.attributes["style"].value;
  currStyle = currStyle.replace(/[;\s]/,"");
  // Get rid of the begining property name bit.
  currStyle = currStyle.split(":")[1];
  currStyle = currStyle.split(/[()]+/);
  target = target.split(/[()]+/);

  for (var x = 0; x < currStyle.length - 1; x++){
    assert_equals(currStyle[x], target[x], message);
    x++;
    var c = currStyle[x].split(",");
    var t = target[x].split(",");
    for (var i in c){
      assert_approx_equals(parseInt(c[i]), parseInt(t[i]), 10, message);
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
//  Exposing functions to be accessed externally                             //
///////////////////////////////////////////////////////////////////////////////
window.setupTests = setupTests;
window.check = check;
window.runTests = runTests;
window.restart = restart;
window.toggleFlash = toggleFlash;
window.animPause = animPause;
window.setState = setState;

window.startSlide = startSlide;
window.moveSlide = moveSlide;
window.stopSlide = stopSlide;
})();