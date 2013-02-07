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

// Constructor for TryItDisplay object.
//This will also create the display.
 function TryItDisplay() {
  display = this;

  this.doc = document;
  console.log(this.name);
  createTryItDisplay();

  this.iframe = new Iframe();
}

// Function that creates the input and output for the TryItYourself object.
function createTryItDisplay() {
  var heading = document.createElement("div");
  heading.setAttribute("class", "heading");
  heading.setAttribute('id', 'heading')
  heading.innerHTML = "TRY IT YOURSELF";
  document.getElementById("tryIt").appendChild(heading);

  var button = document.createElement('button');
  button.setAttribute('onclick', 'display.update()');
  button.setAttribute('id', 'update');
  button.innerHTML = "Update";
  document.getElementById('heading').appendChild(button);

  var code = document.createElement('div');
  code.setAttribute('class', 'code');
  code.setAttribute('id', 'allCode');
  document.getElementById("tryIt").appendChild(code);

  var display = document.createElement('div');
  display.setAttribute('class', 'display');
  document.getElementById('tryIt').appendChild(display);

  var html = document.createElement('div');

  html.setAttribute('class', 'label');
  html.setAttribute('id', 'htmlLabel')
  html.innerHTML = "HTML Code";
  document.getElementById('allCode').appendChild(html);

  var htmlCode = document.createElement('textarea');
  htmlCode.setAttribute('id', 'htmlCode');
  htmlCode.setAttribute('class', 'code');
  document.getElementById('allCode').appendChild(htmlCode);

  var css = document.createElement('div');

  css.setAttribute('class', 'label');
  css.setAttribute('id', 'cssLabel')
  css.innerHTML = "CSS Style";
  document.getElementById('allCode').appendChild(css);

  var cssCode = document.createElement('textarea');
  cssCode.setAttribute('id', 'cssCode');
  cssCode.setAttribute('class', 'code');
  document.getElementById('allCode').appendChild(cssCode);

  var js = document.createElement('div');

  js.setAttribute('class', 'label');
  js.setAttribute('id', 'jsLabel')
  js.innerHTML = "Javascript";
  document.getElementById('allCode').appendChild(js);

  var jsCode = document.createElement('textarea');
  jsCode.setAttribute('id', 'jsCode');
  jsCode.setAttribute('class', 'code');
  document.getElementById('allCode').appendChild(jsCode);

  var heading = document.createElement("div");
  heading.setAttribute("class", "heading fail");
  heading.setAttribute('id', 'passOrFail')
  heading.innerHTML = "YOU PASSED!";
  document.getElementById("tryIt").appendChild(heading);
}

TryItDisplay.prototype.setDefaultHTML = function(newHTML) {
  newHTML = newHTML ? newHTML : "";
  var htmlCode = this.doc.getElementById('htmlCode');
  htmlCode.innerHTML = newHTML;
}

TryItDisplay.prototype.setDefaultCSS = function(newCSS) {
  newCSS = newCSS ? newCSS : "";
  var cssCode = this.doc.getElementById('cssCode');
  cssCode.innerHTML = newCSS;
}

TryItDisplay.prototype.setDefaultJS = function(newJS) {
  newJS = newJS ? newJS : "";
  var jsCode = this.doc.getElementById('jsCode');
  jsCode.innerHTML = newJS;
}

TryItDisplay.prototype.addCheck = function(object, property, time) {
  this.iframe.checks.push("check(" 
      + object + ", " + property + ", " + time + ", 'default');");
}

// Set the default end time for the animation clock.
// Note: this will be overwritten if the user creates an animation longer than
// the time set here.
TryItDisplay.prototype.setTime = function(newTime) {
  this.iframe.time = newTime;
}

// Update takes the information currently in the HTML, CSS, and JS input boxes
// and displays it in the iframe.
TryItDisplay.prototype.update = function() {
  // Add the CSS and HTML into the iframe.
  var addCssHtml = function() {
    var htmlVal = "<div id='test' class='testBox'>" 
        + document.getElementById('htmlCode').value 
        + "\n" +"<div id='dummy' class='test'></div>"
        + "\n" + "</div>";
    var cssVal = document.getElementById('cssCode').value 
        +"\n" +"#dummy { display: none; }";
    iframeDoc.getElementsByTagName("body")[0].innerHTML = htmlVal;
    iframeDoc.getElementsByTagName('style')[0].innerHTML = cssVal;
  }

  // Get the user provided Javascript value, and append additional information
  // to run the tests properly.
  function getJsVal() {
    console.log(display.iframe);
    var jsVal = "setupTutorialTests(); \n" 
        +  document.getElementById('jsCode').value + "\n"
        + "new Animation(document.getElementById('dummy'), {left: '100px'}, "
        + display.iframe.time + ");";

    for(var i = 0; i < display.iframe.checks.length; i++) {
      jsVal += "\n" + display.iframe.checks[i];
    }
    jsVal += " \nrunTests();";
    return jsVal;
  }

  // Add the Javascript value to the iframe.
  var addAnimScript = function() {
    var scriptEle = document.createElement('script');
    var jsVal = getJsVal();
    var scriptDivs = iframeDoc.getElementsByTagName('script');
    if (scriptDivs[scriptDivs.length]) {
      var oldScript = scriptDivs[scriptDivs.length];
      scriptEle.innerHTML = '\n' + jsVal + '\n';
      iframeDoc.getElementsByTagName('body')[0].replaceChild(scriptEle, oldScript);
    } else {
      scriptEle.innerHTML = jsVal;
      par = iframeDoc.getElementsByTagName('body')[0];
      par.appendChild(scriptEle);
    }
  }

  document.getElementById("display").src = document.getElementById("display").src;
  display.doc.getElementById("display").onload =(function() {
    iframeDoc = display.iframe.doc.contentDocument;
    addCssHtml();
    addAnimScript();
  });
}

// Function to call once the user passes the tutorial.
TryItDisplay.prototype.pass = function() {
  display.doc.getElementById("passOrFail").className = "heading pass";
}

// Function to call if the user fails the tutorial.
TryItDisplay.prototype.fail = function() {
  display.doc.getElementById("passOrFail").className = "heading fail";
}

// Constructor for the Iframe object.
function Iframe() {
  this.doc = document.createElement('iframe');
  this.checks = [];
  this.time = 5;

  this.pass = false;

  this.doc.setAttribute('id', 'display');
  this.doc.setAttribute('class', 'display');
  this.doc.setAttribute('src', 'iframe-contents.html');
  document.querySelector('.display').appendChild(this.doc);

  return this;
}

// innerDoc the solution box toggleable*/
var toggleSolution = function() {
  var ele = document.getElementById('toggleText');
  var p = getComputedStyle(ele, null);
  var label = document.getElementById('hideLabel');

  if (p.display === 'none') {
    ele.style.display = 'block';
    label.innerHTML = 'Hide Solution';
  } else if (p.display === 'block') {
    ele.style.display = 'none';
    label.innerHTML = 'Show Solution';
  }
}