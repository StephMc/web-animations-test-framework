// get the name of current page the user is at
// e.g. if the main page of the section is called parallel
// currentSection would be 'parallel'
var currentSection = window.location.href.split('/').pop();
currentSection = currentSection.split('.')[0];
var iframe, exerciseNum;

// waits until all DOM elements are ready to perform
$(document.body).ready(function() {
  // if one of the side menu is clicked
  // update page content without refreshing the whole page
  $('.sideMenu li').click(function(e) {
    exerciseNum = $(this).html().split(' ')[1];
    if ($(this).attr('id') === 'menuLabel') {
      return;
    } else if (parseInt(exerciseNum) !== exerciseNum && isNaN(exerciseNum)) {
      $('.content').load(currentSection + '.html' + ' .content', function() {
        $(this).children().unwrap();
      });
    } else {
      var url = currentSection + 'Exercise' + exerciseNum + '.html';
      // checks if a file/link exist before adding contents
      // into page
      // after contents are loaded, load editor
      $.ajax({
        url: url,
        type: 'HEAD',
        success: function() {
          $('.content').load(url + ' .content', function() {
            $(this).children().unwrap();
            var animNum = findText();
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
         +'\n' + 'position: relative;'
         +'\n' + 'border: 1px solid black;'
         +'\n' + '}';
  editor.setDefaultCSS(css);
  editor.update();

  // load solutions for exercises store in xml files
  // add the solutions into tests
  var solution = loadSolution(exerciseNum);
  console.log(solution);
  for (var i = 0; i < solution.objects.length; i++) {
    var obj = solution.objects[i].childNodes[0].nodeValue;
    var prop = solution.property[i].childNodes[0].nodeValue;
    var time = solution.timeProp[i].childNodes[0].nodeValue;
    editor.addCheck(obj, prop, time);
  }
}

// check if the exercise needs more than 1
// animation divs
// by default returns 1
var findText = function() {
  var content = $('p').text();
  if (content.match('3 + different'))
    return 3;
  else if (content.match('4 different'))
    return 4;
  else
    return 1;
}

// generate a, b, c, d... as to put in as id
var nextId = function(currentId) {
  return String.fromCharCode(currentId.charCodeAt() + 1);
}

var loadSolution = function(exerciseNum) {
  var xmlDoc = loadXMLDoc("solutionsToExercises.xml");
  var solution = xmlDoc.getElementsByTagName("exercise" + exerciseNum);
/*  console.log("exercise" + exerciseNum);
  console.log(solution);*/
  solution.objects = $(solution).find("object");
  solution.property = $(solution).find("property");
  solution.timeProp = $(solution).find("time");

  return solution;
}
