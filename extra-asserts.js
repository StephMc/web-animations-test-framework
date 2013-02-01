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
  // To keep track of all animations
  var animObjects = [];
  // The parGroup all animations need to be added to to achieve 'global' pause
  var parentAnimation;
  // Holds all tests 
  var testStack = [];
  // To keep track of what the dropdown list state is. 
  var runType;
  // The current run type of the animation. 
  var state = "Auto"; 
  // Holds which test packet we are up to.
  var testIndex = 0;
  //Each index holds all the tests that occur at the same time 
  var testPacket = []; 

  // How long to show each manual check for.
  var pauseTime = 500;
  // How long it takes an individual test to timeout.
  var testTimeout = 10000;
  // How long it takes for the whole test system to timeout. 
  var frameworkTimeout = 20000; 

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
  }

  function testAnimation(a, b, c, d){
    var x = new Animation(a, b, c, d);
    animObjects.push(x);
    return x;
  }

  //Call this function before setting up any checks
  //It generates the testing buttons and log and the testharness setup
  function setupTests(timeouts){
    //Use any user stated timeouts
    for (var x in timeouts) {
      if (timeouts[x] == "frameworkTimeout") frameworkTimeout = timeouts[x];
      else if (timeouts[x] == "testTimeout") testTimeout = timeouts[x];     
    }
    
    //Set up padding for option bar
    var padding = document.createElement('div');
    padding.id ="padding";
    padding.style.height = "30px";
    document.body.appendChild(padding);

    //generate options bar
    var optionBar = document.createElement('div');
    optionBar.id ="options";
    var select = document.createElement("select");
    select.setAttribute("id", "runType");
    var button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "restart()");
    button.innerHTML = "Restart";
    var timeOfAnimation = document.createElement('div');
    timeOfAnimation.id = "animViewerText";
    timeOfAnimation.innerHTML = "Current animation time: 0.00";
    document.body.appendChild(optionBar);
    document.getElementById("options").appendChild(select);
    document.getElementById("options").appendChild(button);
    document.getElementById("options").appendChild(timeOfAnimation);

    //Generate the log div
    var log = document.createElement('div');
    log.id ="log";
    document.getElementById("options").appendChild(log);

    //Set buttons
    runType = document.getElementById("runType");
    runType.options[runType.options.length] = new Option('Auto Run', 'Auto');
    runType.options[runType.options.length] = new Option('Manual Run', 'Manual');
    state = window.location.href.split("?")[1];
    
    //Initalse state and setup
    if(state == "Manual") runType.selectedIndex = 1;
    else {
      state = "Auto";
      runType.selectedIndex = 0;
    }
    setup({ explicit_done: true, timeout: frameworkTimeout});
  }

  //Adds each test to a list to be processed when runTests is called
  function check(object, targets, time, message){
    if(testStack.length == 0) reparent();
    //Create new async test
    var test = async_test(message);
    test.timeout_length = testTimeout;
    //store the inital css style of the animated object so it can be used for manual flashing
    var css = object.currentStyle || getComputedStyle(object, null);
    var offsets = [];
    offsets["top"] = getOffset(object).top - parseInt(css.top);
    offsets["left"] = getOffset(object).left- parseInt(css.left);
    if(targets.refTest == true){
      var maxTime = document.animationTimeline.children[0].animationDuration;
      //generate a test for each time you want to check the objects
      for(var x = 0; x < maxTime/time; x++){
        var temp = new testRecord(test, object, targets, time*x, "Property " + targets+" is not satisfied", css, offsets, true);
        testStack.push(temp);
      }
      var temp = new testRecord(test, object, targets, time*x, "Property "+targets+" is not satisfied", css, offsets, "Last refTest");
      testStack.push(temp);
    } else testStack.push(new testRecord(test, object, targets, time, "Property "+targets+" is not satisfied", css, offsets, false));
  }

  //Helper function which gets the current absolute position of an object
  //Shamelessly stolen from http://stackoverflow.com/questions/442404/dynamically-retrieve-the-position-x-y-of-an-html-element
  function getOffset( el ) {
      var _x = 0;
      var _y = 0;
      while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
          _x += el.offsetLeft - el.scrollLeft;
          _y += el.offsetTop - el.scrollTop;
          el = el.offsetParent;
      }
      return { top: _y, left: _x };
  }

  //Put all the animations into a par group to get around global pause issue/bug
  function reparent(){
    var childList = [];
    for (var i = 0; i < document.animationTimeline.children.length; i++) {
      childList.push(document.animationTimeline.children[i]);
    }
    parentAnimation = new ParGroup(childList);
  }

  //Call this after lining up the tests with check
  function runTests(){
    if(testStack.length == 0) reparent();
    animTimeViewer();
    sortTests();
    //to cause no tests to start until 1 frame is rendered
    if(state == "Manual") window.webkitRequestAnimationFrame(function(){testRunner();});
    else {
      parentAnimation.pause();
      window.webkitRequestAnimationFrame(function(){autoTestRunner();});
    }
  }

  function animTimeViewer(){
    var currTime = document.animationTimeline.children[0].iterationTime; 
    if(currTime != null) currTime = currTime.toFixed(2);
    else currTime = 0.00;
    var object = document.getElementById("animViewerText");
    var comp = object.currentStyle || getComputedStyle(object, null);
    object.innerHTML = "Current animation time " + currTime;
    window.webkitRequestAnimationFrame(function(){animTimeViewer();});
  }

  function sortTests(){
    //Sort tests by time to set up timeouts properly
    testStack.sort(testTimeSort);
    for(var x =0; x<testStack.length; x++){
      //check for all tests that happen at the same time
      //And add them to the test packet
      testPacket[testIndex] = [];
      testPacket[testIndex].push(testStack[x]);
      while(x < (testStack.length-1)){
        if(testStack[x].time == testStack[x+1].time){
          x++;
          testPacket[testIndex].push(testStack[x]);
        } else break;
      }
      testIndex++;
    }
    testIndex = 0;
  }

  function testTimeSort(a,b) {return(a.time - b.time)};

  function testRunner(index){
    if(index == null) index = 0;
    var doNextTest = false;
    if(testStack.length > 0) doNextTest = true;
    while(doNextTest && index < testStack.length){
      var currTest = testStack[index];
      if(currTest.time > document.animationTimeline.children[0].animationDuration) currTest.time = document.animationTimeline.children[0].animationDuration;
      if(currTest.time <= document.animationTimeline.children[0].iterationTime){
        doNextTest = true;
        currTest.test.step(function (){
          assert_properties(currTest.object, currTest.targets, currTest.message);
        });
        if(currTest.isRefTest == "Last refTest" || currTest.isRefTest == false) currTest.test.done();
        if(currTest.isRefTest == false) flashing(currTest);
        index++;
      } else {
        doNextTest = false;
      }
    }
    if(index < testStack.length) window.webkitRequestAnimationFrame(function(){testRunner(index);});
    else done();
  }

  function autoTestRunner(){
    if(testIndex != 0 && testIndex < testPacket.length + 1){
      for(var x in testPacket[testIndex-1]){
        var currTest = testPacket[testIndex-1][x];
        currTest.test.step(function (){
          assert_properties(currTest.object, currTest.targets, currTest.message);
        });
        if(currTest.isRefTest == false || currTest.isRefTest == "Last refTest") currTest.test.done();
      }
    }
    if(testIndex < testPacket.length){
      //enough to let the first anim frame render
      if(testPacket[testIndex][0].time == 0) testPacket[testIndex][0].time += 0.02;
      document.animationTimeline.children[0].currentTime = testPacket[testIndex][0].time;
      testIndex++;
      window.webkitRequestAnimationFrame(function(){autoTestRunner();});
    } else {
      parentAnimation.pause();
      done();
    }
  }

  function restart(){
    state = runType.options[runType.selectedIndex].value; //Only gets updated on init and Restart button push
    var url = window.location.href.split("?");
    window.location.href = url[0] + "?" + state;
  }

  // create elements at appropriate locations and flash the elements for manual testing
  function flashing(test) {
    parentAnimation.pause();
    var type = test.object.nodeName;

    //Create a new object of the same type as the thing being tested
    if(type == "DIV") var flash = document.createElement('div');
    else var flash = document.createElementNS("http://www.w3.org/2000/svg", type);
    test.object.parentNode.appendChild(flash);

    if(type == "DIV"){
      flash.style.cssText = test.cssStyle.cssText; //copy the objects orginal css style
      flash.style.position = "absolute";
    } else {
      for(var x = 0; x < test.object.attributes.length; x++){
        flash.setAttribute(test.object.attributes[x].name, test.object.attributes[x].value);
      }
      flash.style.position = "absolute";
    }
    
    var seenTop = false;
    var seenLeft = false;
    for(var propName in test.targets){
      var tar = test.targets[propName];
      var prop = propName
      if(test.cssStyle.position == "relative"){
        if(prop == "left"){
          seenLeft = true;
          tar = parseInt(tar);
          tar += parseInt(test.offsets["left"]);
          tar = tar + "px";
        } else if(prop == "top"){
          seenTop = true;
          tar = parseInt(tar);
          tar += parseInt(test.offsets["top"]);
          tar = tar + "px";
        }
      } else {
        if(prop == "left") seenLeft = true;
        else if(prop == "top") seenTop = true;
      }
      if(type == "DIV"){
        flash.style[prop] = tar;
      } else {
        if(prop.indexOf("transform") != -1) prop = "transform";
        flash.setAttribute(prop, tar);
      }
    }
    
    if (type == "DIV" && test.cssStyle.position == "relative"){
      if(!seenTop){
        flash.style.top = (getOffset(test.object).top - getOffset(test.object.parentNode).top) +"px";
        //console.log(getOffset(test.object.parentNode).top);
      }
      if(!seenLeft){
        flash.style.left = (getOffset(test.object).left - getOffset(test.object.parentNode).left)+"px";
        //console.log(getOffset(test.object.parentNode).left);
      }
    }
    
    //Set up the border
    if(type == "DIV"){
      flash.style.borderColor = 'black';
      flash.style.borderWidth = 'thick';
      flash.style.borderStyle = 'solid';
      flash.style.opacity = 1;
    } else {
      flash.setAttribute("stroke", "black");
      flash.setAttribute("stroke-width", "5px");
    }
    
    setTimeout(function() {
      flash.parentNode.removeChild(flash);
      if(document.animationTimeline.children[0].iterationTime 
          < document.animationTimeline.children[0].animationDuration - 0.01) parentAnimation.play();
    }, pauseTime);
  }

  add_completion_callback(function (allRes, status) {
      console.log("Test run completed", allRes, status);
      testResults = allRes;
      window.testResults = testResults;
  });

  /////////////////////////////////////////////////////////////////////////
  //  All asserts below here                                             //
  /////////////////////////////////////////////////////////////////////////

  function assert_properties(object, targets, message, epsilons){
    var isSVG = (object.nodeName != "DIV");
    var tempOb = document.createElement(object.nodeName);
    tempOb.style.position = "absolute";
    object.parentNode.appendChild(tempOb);

    for(var propName in targets){
      if(targets[propName].nodeName != undefined) var tar = (targets[propName].currentStyle || getComputedStyle(targets[propName], null))[propName];
      else var tar = targets[propName];

      if(isSVG){
        if(propName.indexOf("transform") == -1) tempOb.setAttribute(propName, tar);
      } 
      else tempOb.style[propName] = tar;
    } 
    
    if(isSVG){
      var compS = object.attributes;
      var tempS = tempOb.attributes;
    } else {
      var compS = object.currentStyle || getComputedStyle(object, null);
      var tempS = tempOb.currentStyle || getComputedStyle(tempOb, null);
    }
    
    for(var propName in targets){
      if(propName != "refTest"){
        if(isSVG && propName.indexOf("transform") != -1) assert_transform(object, targets[propName], message);
        else {
          if(isSVG){
            var t = tempS[propName].value;
            var c = compS[propName].value;
          } else {
            var t = tempS[propName];
            var c = compS[propName];
          }
          t = t.replace(/[^0-9,.]/g, "");
          t = t.split(",");

          c = c.replace(/[^0-9,.]/g, "");
          c = c.split(",");

          for(var x in t){
            assert_approx_equals(Number(c[x]), Number(t[x]), 10, message + " " + x);
          }
        }
      }
    }
    tempOb.remove();
  }

  //deals with svg transforms *sigh*
  function assert_transform(object, target, message){
    var currStyle = object.attributes["style"].value;
    currStyle = currStyle.replace(/[;\s]/,"");
    currStyle = currStyle.split(":")[1]; //get rid of the begining property name bit
    
    currStyle = currStyle.split(/[()]+/);
    target = target.split(/[()]+/);

    var x = 0;
    while(x < currStyle.length-1){
      assert_equals(currStyle[x], target[x], message);
      x++;
      var c = currStyle[x].split(",");
      var t = target[x].split(",");
      for(var i in c){
        assert_approx_equals(parseInt(c[i]), parseInt(t[i]), 10, message);
      }
      x++;
    }
  }

  /* Exposing functions to be accessed externally */
  window.setupTests = setupTests;
  window.testAnimation = testAnimation;
  window.check = check;
  window.runTests = runTests;
  window.restart = restart;
})();

