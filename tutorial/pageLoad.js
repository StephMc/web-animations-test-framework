// get the name of current page the user is at
// e.g. if the main page of the section is called parallel
// currentSection would be 'parallel'
var currentSection = window.location.href.split("/").pop();
currentSection = currentSection.split(".")[0];
console.log(currentSection);

// waits until all DOM elements are ready to perform
$(document.body).ready(function() {

  // if one of the side menu is clicked
  // update page content without refreshing the whole page
  $(".sideMenu li").click(function(e) {
    var exerciseNum = $(this).html().split(" ")[1];
    if ($(this).attr("id") === "menuLabel") {
      return;
    } else if (parseInt(exerciseNum) !== exerciseNum && isNaN(exerciseNum)) {
      $(".content").load(currentSection + ".html" + " .content", function() {
        $(this).children().unwrap();
      });
    } else {
      $(".content").load(currentSection + "Exercise" + exerciseNum + ".html" + " .content", function() {
        $(this).children().unwrap();
      });
    };
  });
});