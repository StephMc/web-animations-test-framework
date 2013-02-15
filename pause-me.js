/**
* Include this file in any animation you want to auto gen tests for
* This file exists because there is no global pause function.
* When there is, use that method of pausing instead of pausing via
* parentAnimation
*/

(function() {
  var parentAnimation;
  // Put all the animations into a par group to get around global pause issue.
  function reparent(){
    var childList = [];
    for (var i = 0; i < document.animationTimeline.children.length; i++) {
      childList.push(document.animationTimeline.children[i]);
    }
    parentAnimation = new ParGroup(childList);
    window.parentAnimation = parentAnimation;
  }
  window.reparent = reparent;
})();