// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// This is an override of the `active-line` selection addon, which only shows 
// selected line when the editor is in focus. Specifically used in cells in 
// Jupyter notebooks, which show multiple cells (i.e. editors) on screen at once.
// This addon also doesn't highlight selected line if it's the only line in the 
// editor.
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define('codemirror/addon/selection/active-line-notebook-cell',["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  var WRAP_CLASS = "CodeMirror-activeline";
  var BACK_CLASS = "CodeMirror-activeline-background";
  var GUTT_CLASS = "CodeMirror-activeline-gutter";

  CodeMirror.defineOption("styleActiveLine", false, function(cm, val, old) {
    var prev = old == CodeMirror.Init ? false : old;
    if (val == prev) return
    if (prev) {
      cm.off("focus", onFocus);
      cm.off("blur", onBlur);
      cm.off("beforeSelectionChange", selectionChange);
      clearActiveLines(cm);
      delete cm.state.activeLines;
    }
    if (val) {
      cm.state.activeLines = [];
      cm.on("blur", onBlur);
      cm.on("focus", onFocus);
    }
  });

  function clearActiveLines(cm) {
    for (var i = 0; i < cm.state.activeLines.length; i++) {
      cm.removeLineClass(cm.state.activeLines[i], "wrap", WRAP_CLASS);
      cm.removeLineClass(cm.state.activeLines[i], "background", BACK_CLASS);
      cm.removeLineClass(cm.state.activeLines[i], "gutter", GUTT_CLASS);
    }
  }

  function sameArray(a, b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++)
      if (a[i] != b[i]) return false;
    return true;
  }

  function updateActiveLines(cm, ranges) {
    if (cm.lineCount() == 1) {
      // Don't highlight the active line if it's just one
      clearActiveLines(cm);
      cm.state.activeLines = [];
      return;
    }
    var active = [];
    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var option = cm.getOption("styleActiveLine");
      if (typeof option == "object" && option.nonEmpty ? range.anchor.line != range.head.line : !range.empty())
        continue
      var line = cm.getLineHandleVisualStart(range.head.line);
      if (active[active.length - 1] != line) active.push(line);
    }
    if (sameArray(cm.state.activeLines, active)) return;
    cm.operation(function() {
      clearActiveLines(cm);
      for (var i = 0; i < active.length; i++) {
        cm.addLineClass(active[i], "wrap", WRAP_CLASS);
        cm.addLineClass(active[i], "background", BACK_CLASS);
        cm.addLineClass(active[i], "gutter", GUTT_CLASS);
      }
      cm.state.activeLines = active;
    });
  }

  function onFocus(cm) {
    cm.on("beforeSelectionChange", selectionChange);
    updateActiveLines(cm, cm.listSelections());
  }

  function onBlur(cm) {
    cm.off("beforeSelectionChange", selectionChange);
    clearActiveLines(cm);
    cm.state.activeLines = [];
  }

  function selectionChange(cm, sel) {
    updateActiveLines(cm, sel.ranges);
  }
});