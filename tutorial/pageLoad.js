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

// get the name of current page the user is at
// e.g. if the main page of the section is called parallel
// currentSection would be 'parallel'
var currentSection = window.location.href.split('/').pop();
currentSection = currentSection.split('.')[0];
var iframe, exerciseNum;

console.log(currentSection);

// waits until all DOM elements are ready to perform
$(document.body).ready(function() {   
  // if one of the side menu is clicked   
  //update page content without refreshing the whole page   
  $('.sideMenu li').click(function(e) {
    exerciseNum = $(this).html().split(' ')[1];
    if (isNumber(exerciseNum) == false) {
      $('.content').load(currentSection +'.html' + ' .content', function() {
        $(this).children().unwrap();
      });
    } else {
      var url = currentSection + '-exercise-' + exerciseNum +'.html';
      // checks if a file/link exist before adding contents
      //into page
      // after contents are loaded, load editor
      $.ajax({
        url: url,
        type: 'HEAD',
        success: function() {
          $('.content').load(url + ' .content', function() {
            $(this).children().unwrap();
            var animNum = findDivNum();
            loadEditor(animNum);
          });
        }
      });
    }
  });
});

// this loads the editor dynamically into page content
var loadEditor = function(animNum) {
  var html = "", currentId = 'a';

  // generate a number of animation divs according to
  // the requirements of the exercise
  // such as in sequence section
  for (var i = 0; i < animNum; i++) {
    html += '<div id=\"' + currentId + '\" class=\"anim\"></div>' + '\n';
    currentId = nextId(currentId);
  }

  // create a new editor object
  var editor = new TryItDisplay();
  editor.setDefaultHTML(html);

  // common css for all divs
  var css = '.anim {'
         +'\n' + 'background-color: red;'
         +'\n' + 'border-radius: 10px;'
         +'\n' + 'width: 100px;'
         +'\n' + 'height: 50px;'
         +'\n' + 'top: 0px;'
         +'\n' + 'left: 0px;'
         +'\n' + 'position: absolute;'
         +'\n' + 'border: 1px solid black;'
         +'\n' + '}';
  editor.setDefaultCSS(css);
  editor.update();

  // load solutions for exercises store in json files
  // add the solutions into tests
  loadTest(exerciseNum, editor);
/*  console.log(tests);
  console.log('im second');
  for (var i = 0; i < tests.length; i++) {
    var elem = tests[0].element;
    var p = tests[0].property;
    var t = tests[0].timeProp;
    editor.addCheck(elem, p, t);
  }*/
}

var isNumber = function(str) {
  str = parseInt(str);
  if (isNaN(str))
    return false;
  return true;
}

// check if the exercise needs more than 1
// animation divs
// by default returns 1
var findDivNum = function() {
  var content = $('p').text();
  var match = content.match(/\b(\d+) different animation\b | \b(\d+) children\b/);

  if (match) {
    if (isNumber(match[0])) {
      return parseInt(match[0]);
    }
  }
  return 1;
}

// generate a, b, c, d... as to put in as id
var nextId = function(currentId) {
  return String.fromCharCode(currentId.charCodeAt() + 1);
}

// load solution from xml files and store them
// into an object
// loadXMLDoc is a function from the external script
// loadXMLDoc.js
/*var loadSolution = function(exerciseNum) {
  var xmlDoc = loadXMLDoc("solutionsToExercises.xml");
  var solution = xmlDoc.getElementsByTagName("exercise" + exerciseNum);

  solution.objects = $(solution).find("object");
  solution.property = $(solution).find("property");
  solution.timeProp = $(solution).find("time");s

  return solution;
}
*/

// load solutions using json
var loadTest = function(exerciseNum, editor) {
  var exercise = "exercise" + exerciseNum;
  var tests;
  console.log('loading tests');
  $.getJSON("../tests-to-exercises.json")
    .success(function(data) {
       tests = data[currentSection][0][exercise];
      for (var i = 0; i < tests.length; i++) {
        editor.addCheck(tests[i].element, tests[i].property, tests[i].timeProp);
      }
    })
    .error(function(data, status, xhr) {
      console.log('Error: ' + status );
      console.log('xhr: ' + xhr);
    });
}