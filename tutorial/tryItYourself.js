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
 

// get default html values
var htmlVal;
var cssVal;
var jsVal

// elements such as animation divs and its associated style
// is appended into the body of iframe as well as any associating
// js scripts
var displayDefault = function() {
  htmlVal = document.getElementById('htmlCode').value;
  htmlVal += "\n" + "<div id='b' class='ref'></div>";
  cssVal = document.getElementById('cssCode').value;
  cssVal = (cssVal + "\n" + ".ref {"
  + "\n" + "background-color: red;"
  + "\n" + "opacity:0;"
  + "\n" + "border-radius: 10px;"
  + "\n" + "width: 100px;"
  + "\n" + "height: 50px;"
  + "\n" + "top: 0px;"
  + "\n" + "left: 0px;"
  + "\n" + "position: absolute;"
  + "\n" +"}");
  console.log(cssVal);

  frames['display'].document.documentElement.getElementsByTagName("body")[0].innerHTML = htmlVal;
  console.log(frames['display'].document);
  frames['display'].document.getElementsByTagName('style')[0].innerHTML = cssVal;
}

// executed when button called update is clicked
// extract texts from the 3 text areas,
var update = function() {  

  htmlVal = document.getElementById('htmlCode').value;
  htmlVal += "\n" + "<div id='b' class='ref'></div>";
  cssVal = document.getElementById('cssCode').value;
  jsVal = document.getElementById('jsCode').value;

  iframeDoc = frames['display'].document;
  iframeDoc.documentElement.getElementsByTagName("body")[0].innerHTML = htmlVal;
  console.log(iframeDoc);
  iframeDoc.getElementsByTagName('style')[0].innerHTML = cssVal;
  console.log(document.getElementsByTagName('script'));
  
  var scriptEle = document.createElement('script');
  //scriptEle = jsVal;

  var addAnimScript = function() {
    var scriptDivs = iframeDoc.getElementsByTagName('script');
    if (scriptDivs[scriptDivs.length]) {
      var oldScript = frames['display'].document.getElementsByTagName('script')[scriptDivs.length];
      scriptEle.innerHTML = '\n' + jsVal + '\n';
      iframeDoc.getElementsByTagName('body')[0].replaceChild(scriptEle, oldScript);
    } else {
      scriptEle.innerHTML = jsVal;
      par = iframeDoc.getElementsByTagName('body')[0];
      par.appendChild(scriptEle);
    }
  }
  window.onload = addAnimScript();

  /*
  // innerDoc the solution box toggleable
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
  }*/
}

var contentNotEqual = function(oldText, newText) {
  if (oldText !== newText) {
    return true;
  }
  return false;
}
