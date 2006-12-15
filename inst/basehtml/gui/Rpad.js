/*
    Rpad.js  --  Rpad client-side functionality

    by Tom Short, EPRI, tshort@epri.com

    (c) Copyright 2005 - 2006. by EPRI, Inc.

    Permission is hereby granted, free of charge, to any person obtaining a
    copy of this software and associated documentation files (the "Software"),
    to deal in the Software without restriction, including without limitation
    the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included
    in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    ITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
    DEALINGS IN THE SOFTWARE.
*/


////////////////////////////
// This provides the client-side Rpad functionality. The code is arranged by 
// module function. Basically each module should only depend on functions and 
// objects defined in modules above the given object (and not on modules below).
// The main modules are:
//    dojo.widget.HtmlRpad - the code/results widget that goes on a page
//    rpad - basic code for logging in, sending commands to the server and receiving results
//    rpad.script - registration and processing for various scripts (R, javascript, etc.)
//    rpad calculations - page traversal and calculation control code
//    rpad.gui - the gui/page editor (menu bar, page editing, ...)
//    rpad.gui2 - a more cross-platform gui that uses the dojo RichText editor
//    rpad.utils - these utility functions are defined throughout this 
//                 file, mainly in the order where they're needed.

////////////////////////////
// Read in the style sheet
// 
//
document.write('<style type="text/css" rpadIgnore="true">@import url(gui/Rpad.css);</style>');

////////////////////////////
// Rpad configuration options
// 
//

if(dj_undef("rpadConfig")){
    var rpadConfig = {};
}

// default configuration options
var _config = {
    gui: "none",     // options are "none", "standard", "alternate"
    // default options for Rpad widgets:
    rpadType: "R",
    rpadHideSource: false,
    rpadOutput: "normal",   // options are "normal", "none", "javascript"
    rpadRun: "normal",
    onBeforeUnload: false  // ask before leaving a page?
}

if (typeof rpadConfig == "undefined") { 
    rpadConfig = _config; 
} else {
    for (var _option in _config) {
        if (typeof rpadConfig[_option] == "undefined") {
            rpadConfig[_option] = _config[_option];
        }
    }
}
   
////////////////////////////
// The main namespace for Rpad
// 
//

var rpad = {};
   
////////////////////////////
// Utility functions
// Internal utility functions for Rpad
// More are defined throughout this file

rpad.utils = {};
rpad.utils.getTextContent = function(node) {
  if (node.nodeType == 3) { // text node
    if (node.parentNode.nodeName == "PRE") { // really should see if the style has "white-space: pre"
      return node.nodeValue;
    } else {
      return node.nodeValue.replace(/\n/g," ");
    }
  }
  if (node.nodeType == 1) { // element node
    if (node.nodeName == "BR") return "\n";
    if (node.nodeName == "TEXTAREA") return node.value;
    if (node.nodeName == "INPUT") return node.value;
    var text = [];
    for (var chld = node.firstChild;chld;chld=chld.nextSibling) {
        text.push(rpad.utils.getTextContent(chld));
    } return text.join("");
  } return ""; // some other node, won't contain text nodes.
}  

////////////////////////////
// This provides the basic Rpad widget, with input (DOM node rpadInput)
// and output (DOM node rpadResults)
// It's public methods are:
//    initialize(): get it ready
//    toggleVisibility(): hide and unhide source
//    show(): show source
//    hide(): hide source
//    calculate(): calculate it
// The main CSS classes available for modification are:
//    Rpad_input
//    Rpad_output
   
dojo.provide("dojo.widget.Rpad");
//dojo.provide("dojo.widget.HtmlRpad");
   
//dojo.require("dojo.lang.*");
//dojo.require("dojo.io.*");
// dojo.require("dojo.widget.*");
// dojo.require("dojo.event.*");
// dojo.require("dojo.xml.*");
// dojo.require("dojo.xml.Parse");
// dojo.require("dojo.widget.Parse");

dojo.require("dojo.widget.*");
dojo.require("dojo.widget.HtmlWidget");
dojo.require("dojo.event.*");
dojo.require("dojo.html.style");
dojo.require("dojo.html.selection");
dojo.require("dojo.debug.console");

rpad.utils.parseNode = function(node) {
// parse the block for other dojo stuff
// bits from David Schontzler 
    var frag = new dojo.xml.Parse().parseElement(node, null, true);
    dojo.widget.getParser().createComponents(frag);
}

rpad.utils.parseNode = function(node) {
// parse the block for other dojo stuff http://dojotoolkit.org/pipermail/dojo-interest/2006-August/014495.html
     dojo.widget.createWidget(node);
}


dojo.widget.defineWidget(
    "dojo.widget.Rpad",
    dojo.widget.HtmlWidget,
{
    templateString:
        '<div dojoAttachPoint="rpadWrapper">                                                        '+
        '    <div dojoAttachPoint="rpadInputWrapper">                                               '+
        '        <span contentEditable = "false">                                                   '+
        '            <textarea dojoAttachPoint="textarea" style="display: none;"></textarea>        '+
        '        </span>                                                                            '+
        '    </div>                                                                                 '+
        '    <div contentEditable = "false">                                                        '+
        '        <div class="Rpad_results" dojoAttachPoint="rpadResults" style="display: none;">    '+
        '            Results                                                                        '+
        '        </div>                                                                             '+
        '    </div>                                                                                 '+
        '</div>                                                                                     ',
                                                                                                   

//    this.templateCssPath = dojo.uri.dojoUri("src/widget/templates/Rpad.css");
   
//    widgetType: "Rpad",
    rpadType: rpadConfig.rpadType,
    rpadOutput: rpadConfig.rpadOutput,
    rpadRun: rpadConfig.rpadRun,
    rpadHideSource: rpadConfig.rpadHideSource,
    visible: true,
   
    tagName: "dojo:rpad",
   
    fillInTemplate: function(args, frag){
         this.rpadInput = frag[this.tagName].nodeRef.cloneNode(true);
         dojo.html.addClass(this.rpadInput, "Rpad_input");
         this.rpadInput.dojotype = null;
         this.rpadInput.removeAttribute("dojotype");
         this.rpadInputWrapper.appendChild(this.rpadInput);
//         rpad.utils.parseNode(this.rpadInput);
   
        if (this.rpadInput.nodeName == "TEXTAREA" || this.rpadInput.nodeName == "INPUT") {
            this.rpadInputWrapper.setAttribute("contentEditable", false);
            this._isNormallyContentEditable = false;
        } else {
            this._isNormallyContentEditable = null;
        }
    },
    initialize: function() {
        this.domNode.rpadType = this.rpadType;
        this.domNode.setAttribute("rpadType", this.rpadType);
        this.domNode.setAttribute("rpadRun", this.rpadRun);
        if (this.rpadHideSource) this.hide();
        this.rpadInput.rpadWidget = this;
        this.domNode.rpadWidget = this;
    },
    show: function() {
        this.rpadInput.style.display = "";
        this.rpadInput.parentNode.contentEditable = this._isNormallyContentEditable; // broken in IE
        this.visible = true;
    },
    hide: function() {
        this.rpadInput.style.display = "none";
        this.rpadInput.parentNode.contentEditable = false;
        this.visible = false;
    },
    toggleVisibility: function() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    },
    calculate: function() {
        var rpadResults = this.rpadResults;
        if (this.rpadOutput == "javascript") { // use for JSON or other server-side javascript
            rpadResults = "javascript";
        } else if (this.rpadOutput == "none") {
            rpadResults = null;
        }
        rpad.send(this.rpadType, rpad.utils.getTextContent(this.rpadInput), 
                  rpadResults, this.rpadInput);
    }, 
    onReceive: function() { // stub available for attaching
    },
    getHtml: function() { // get a HTML representation of the widget
        var result = "<" + this.rpadInput.tagName.toLowerCase() + ' dojoType="Rpad"';
        if (this.rpadType != rpadConfig.rpadType)
            result += ' rpadType="' + this.rpadType + '"';
        if (this.rpadOutput != rpadConfig.rpadOutput)
            result += ' rpadOutput="' + this.rpadOutput + '"';
        if (this.rpadRun != rpadConfig.rpadRun)
            result += ' rpadRun="' + this.rpadRun + '"';
        if (this.rpadHideSource != rpadConfig.rpadHideSource)
            result += ' rpadHideSource="' + this.rpadHideSource + '"';
        result += ">" + rpad.utils.getTextContent(this.rpadInput) + 
                  "</" + this.rpadInput.tagName.toLowerCase() + ">";
        return result;
    }
})  
   
// dojo.inherits(dojo.widget.HtmlRpad, dojo.widget.HtmlWidget);
// dojo.widget.tags.addParseTreeHandler("dojo:rpad");

////////////////////////////
// NOT USED!!!
// This provides a basic Rpad form widget. It's a small wrapper around
// input's, textarea's, and selects.
// It's public methods are:
//    calculate(): calculate it
//    onDoneCalc(): calculations done
   

dojo.widget.RpadForm = function(){
    dojo.widget.Widget.call(this);
   
    this.widgetType = "RpadForm";
    this.tagName = "dojo:rpadform";
   
    this.calculate = function() {
        rpad.send(this.rpadType, rpad.utils.getTextContent(this.domNode), 
                  this.rpadResults, this.rpadInput);
    } 
    this.onDoneCalc = function() { // stub available for attaching
    }
}  
   
// dojo.inherits(dojo.widget.RpadForm, dojo.widget.HtmlWidget);
// dojo.widget.tags.addParseTreeHandler("dojo:rpadform");
   
////////////////////////////
// This provides the base Rpad class (it's not R specific)
// It's public methods are:
//    send(rpadType, commands, rpadResults, node): send for processing
//    receive(rpadResults, data, startNode): receive processed results
//    updateResults(rpadResults, data, rpadOutputStyle): update results received
// Note: More methods are defined below.
   
rpad.dir = "";
rpad._runState = "init";  
rpad._activeWindow = window; 
   
rpad.send = function(rpadType, commands, rpadResults, rpadInput, jsOnDone){
// Send "commands" for processing. 
// "commands" are script text of type "rpadType": "R", "file", ...
// Put results received in the DOM node "rpadResults".
// Send along the originating DOM node "rpadInput" in case it's needed.
//dojo.debug('SEND:'+commands);
    rpad.script.run(rpadType, commands, rpadResults, rpadInput, jsOnDone)
    dojo.log.debug('SEND: '+commands);
}  
   
rpad.sendThenRun = function(rpadType, commands, jsOnDone){
// NOT WORKING YET
// Send "commands" for processing. 
// "commands" are script text of type "rpadType": "R", "file", ...
// Ignore results.
// Eval the "jsOnDone" when results received.
//dojo.debug('SEND:'+commands+rpadInput.nodeName);
  rpad.script.run(rpadType, commands, rpadResults, rpadInput)
}  
   
rpad.receive = function(rpadResults, data, rpadInput, jsOnDone) {
// Receive the processed commands "data" (text/html).
// Put results received in the DOM node "rpadResults".
// Send along the originating DOM node "rpadInput" in case it's needed.
// if rpadResults == "javascript", exec the javascript instead of inserting results in the DOM
//dj_debug("REC:"+rpadInput.nodeName+data);
//dj_debug("REC:"+data);
    dojo.log.debug('REC:\n'+data);
    if (rpadInput.onReceive) rpadInput.onReceive(); // fire an event inputs can attach to
    if (rpadInput.rpadWidget) {
        rpadInput.rpadWidget.onReceive(); // fire an event Rpad widgets can attach to
        var rpadOutputStyle = rpadInput.rpadWidget.rpadOutput;
    }
    if (rpadResults == "javascript") {
        dj_eval(data);
    } else if (rpadResults != null) {
        rpadResults.style.display = "";
        rpad.updateResults(rpadResults, data, rpadOutputStyle);       
    }
    if (jsOnDone) 
        setTimeout(function() {dj_eval(jsOnDone)}, 50); // IE7 can die without the timeout
    if (rpad._doKeepGoing) { // this would be better separated, but connect was acting funny
        rpad.calculateNextNode(rpadInput);
    }
}  
   
rpad.updateResults = function(rpadResults, data, rpadOutputStyle) {
// Insert the processed commands "data" (text/html)
// in the DOM node "rpadResults".
// Decode the text/html and handle the switching between
// html mode and text mode (done with <htmlon/> and <htmloff/>.
    function fixhtmlencodings(str) {  
      str = str.replace(/&/g,"&amp;");  
      str = str.replace(/</g,"&lt;");  
      str = str.replace(/>/g,"&gt;");  
      str = str.replace(/\n/g,"\n<BR/>");
      str = str.replace(/ /g,"&#160;"); // replace spaces with nonbreaking spaces
      return(str);
    }
    
    function fixformat(str, type) {
    // <htmlon/> turns html mode on
    // <htmloff/> turns html mode off
    // s='aasdf asdf asdf <htmlon/>asdf asdf <htmloff/>asdf asdf'
      var resultstr = "";
      var ishtml = type == 'html';
      var s = "";
    
      do {
        if (ishtml) {
          var s1 = str.split('<htmloff\/>');
          s1[0] = s1[0].replace(/<htmlon\/>/gi,""); // get rid of redundant tags
          s = s1[0];
          s1[0] = "";
          str = s1.join('<htmloff\/>').replace('<htmloff\/>','') // rejoin all but the first with <htmloff/>
          resultstr += s;
          ishtml = false;
        } else {
          var s1 = str.split('<htmlon\/>');
          s1[0] = s1[0].replace(/<htmloff\/>/gi,""); // get rid of redundant tags
          s = s1[0];
          s1[0] = "";
          str = s1.join('<htmlon\/>').replace('<htmlon\/>','')
          resultstr += fixhtmlencodings(s);
          ishtml = true;
        }
      } while (str != "");
      return(resultstr);
    }
    if (dojo.render.html.ie) {
        rpadResults.innerHTML = fixformat(data, rpadOutputStyle);  
    } else { // move rpadResults out of the DOM and back in to get FF to execute embedded scripts
        var marker = document.createElement("DIV");
        dojo.dom.insertAfter(marker, rpadResults);
        var node = document.createElement("DIV");
        node.appendChild(rpadResults);
        rpadResults.innerHTML = fixformat(data, rpadOutputStyle);  
        marker.parentNode.replaceChild(rpadResults, marker);
    }    
    rpad.utils.parseNode(rpadResults);
}  
   
////////////////////////////
// Rpad login: send a login command to the server and update the 
// appropriate working directory.
// Hook into this to add other login handlers.
   
rpad.login = function() {
    dojo.io.bind({
        url: "server/Rpad_process.pl?command=login",
        load: rpad.afterLogin,
        error: function(type, error){ dojo.debug(error); },
        mimetype: "text/html"
    });
}  
rpad.afterLogin = function(type, data, evt){
    rpad.dir = data;
}

   
////////////////////////////
// This provides script registration/processing
// It's public methods are:
//    register(rpadType, run): register the given js function "run" of type "rpadType"
//    unregister(rpadType): unregister the script "rpadType"
//    run(rpadType, commands, rpadResults, node): run the given script
//    serverScript(url, getContent): return a js function that will send data to a server with the appropriate url
//                          "getContent" is a function with arguments (commands, node) 
   
rpad.script = {};
rpad.script._scripts = [];
rpad.script.registered = function() {
    return rpad.script._scripts;
}  
rpad.script.register = function(rpadType, run) {
    rpad.script._scripts[rpadType] = run;
}  
rpad.script.unregister = function(rpadType) {
    rpad.script._scripts[rpadType] = null;
}  
rpad.script.run = function(rpadType, commands, rpadResults, rpadInput, jsOnDone) {
    rpad.script._scripts[rpadType](commands, rpadResults, rpadInput, jsOnDone); 
}  
rpad.script.serverScript = function(url, getContent) {
// Returns a js function that will send data to a server 
// with the appropriate url.
// "getContent" is a function with arguments (commands, rpadResults, node) that returns
// the content to be passed to the server.
    return function(commands, rpadResults, rpadInput, jsOnDone) {    
        dojo.io.bind({
            url: url,
            content: getContent(commands, rpadInput),
            method: "POST",
            load: function(type, data, evt){
                 rpad.receive(rpadResults, data, rpadInput, jsOnDone)
            },
//            error: function(type, error){ dojo.debug(error); },
            error: function(type, error){ props(error); dojo.debug(error.number); dojo.debug(error.message);},
            mimetype: "text/html"
        });
    }
}  

// This provides a stub for form processing:
   
rpad.processForm = function(nodes) {};
  
   
////////////////////////////
// Rpad calculation routines, providing the following methods that the user
// could call:
//   - calculatePage(): Calculates the whole page.
//   - calculateNext(node): Calculates the first Rpad widget after or under the given DOM node 
// The following are used internally but may be "connected to" to change functionality:
//   - calculateNextNode(node, doit): Calculates the first Rpad widget after the given DOM node 
//   - calculateNode(node, doit): Calculates the given DOM node (Rpad widget or form element)
// The page also keeps track of the internal state of the page with the following:
//   - _doKeepGoing: If true, keeps traversing the DOM tree and calculating appropriate nodes
//   - _runState: "init" initially and "normal" after the first pass through the page
   
   
rpad.calculatePage = function(){
//dojo.debug('calcPage');
  rpad.calculateTree(rpad.base);  
}  
rpad.calculateTree = function(node) {
//dojo.debug("CALCTREE: "+node.tagName+node.parentNode.tagName+node.parentNode.parentNode.tagName);
  rpad._doKeepGoing = true;  // turn on page traversal
  rpad._serverTries = 0;
  rpad._startingNode = node;  // remember the starting point
  rpad.calculateNextNode(node);  
}  
rpad.afterPageCalculation = function() {
//dojo.debug("afterPageCalculation");
    rpad._doKeepGoing = false;  // turn off page traversal
    rpad._runState = "normal";  
}; 
rpad.pageError = function() {dojo.debug('page error')};

rpad.calculateNextNode = function(node, doit) { // non-recursive
// Calculate the next Rpad element after or below the DOM node "node".
// Traverses the DOM tree starting at the DOM node "node".
// Keeps going until it finds and calculates a "calculatable" DOM node.
// "doit" means calculate it regardless of rpad._runState and the status of node.rpadRun
//  try {
    while (typeof(node) != "undefined" && node != null) {
      if (node.firstChild != null) { // try children
        if (rpad.calculateNode(node.firstChild, doit)) {
          return;
        }
        node = node.firstChild;
      }
      else { // try siblings and parent's siblings
        while (node.nextSibling == null && (node.nodeType != 1 || node.nodeName != 'BODY') && node != rpad._startingNode) {
          node = node.parentNode;
        }   
        if (node.nodeName == 'BODY' || node == rpad._startingNode) { // the end of the tree traversal
          rpad.afterPageCalculation();
          return;
        } else { // found a way to keep traversing the tree
          if (rpad.calculateNode(node.nextSibling,doit)) {
            return;
          }
          node = node.nextSibling;
        }
      }
    }
//  } catch(err) {
//    rpad.pageError();
//  }
  rpad.afterPageCalculation();
}  
   
rpad.utils.getWidget = function(node) {
// returns the dojo widget associated with the given DOM "node"
// Dylan Schiemann
// http://dojotoolkit.org/pipermail/dojo-interest/2005-September/000913.html
    var unaryFunc = function(x){
        if(x.domNode == node){
            return true;
        }
    }
    return dojo.widget.getWidgetsByFilter(unaryFunc)[0];
}  
rpad.utils.getRpadWidget = function(node) {
// returns the dojo widget associated with the given DOM "node"
// Dylan Schiemann
// http://dojotoolkit.org/pipermail/dojo-interest/2005-September/000913.html
    var unaryFunc = function(x){
        if(x.domNode == node && x.widgetType == "Rpad"){
            return true;
        }
    }
    return dojo.widget.getWidgetsByFilter(unaryFunc)[0];
}  
rpad._hasNoFormParent = function(node) {
// returns true if the DOM "node" does not have a FORM-element parent
    while (node.nodeName != "FORM" && node.nodeName != "BODY")
        node = node.parentNode;
    return node.nodeName == "BODY";
}  
   
rpad.calculateNode = function(node, doit) { // returns true if a "calculatable" node is found
// Calculates the DOM node "node".
// "doit" means calculate it regardless of rpad._runState and the status of node.rpadRun
// Returns true if it found a node to calculate, false if not.
    if (node.nodeType != 1) return false;
      
    var rrun = node.getAttribute("rpadRun");
    var isReady =  (rpad._runState == "init" && rrun == "init") ||
                   (rpad._runState == "normal"  && (rrun == null || rrun == "" || rrun == "normal")) ||
                   (rrun == "all") ||
                   doit;
//    if (!isReady) return false;
    if (typeof( node.rpadType ) != "undefined" && isReady) {      
//dojo.debug("CALCNODE: "+node.tagName+node.parentNode.tagName+node.parentNode.parentNode.tagName+node.rpadType);
        var widget = rpad.utils.getWidget(node);
        if (typeof(widget) != "undefined" && widget.calculate != null) {
            widget.calculate();
            return true;
        }
    }
    // for forms, process the whole form at once
    if (node.nodeName == "FORM") {
        rpad.processForm(node.elements);
        return true;
    }
    // process standalone input fields individually
    if ((node.nodeName == "INPUT" || node.nodeName == "SELECT") && 
        node.getAttribute("name") != "" && 
        rpad._hasNoFormParent(node)) {
            rpad.processForm(node);
            return true;
    }
    return false;
}  
   
// Mapping for backwards compatibility
var Rpad_calculate = rpad.calculatePage;
   
// make Rpad keep calculating nodes after each node is processed
// had to disable it and add it directly to rpad.receive because it was acting funny on Mozilla
//dojo.event.connect(rpad, "receive", 
//    function (rpadResults, data, rpadInput) {
//        if (rpad._doKeepGoing)
//            rpad.calculateNextNode(rpadInput);
//    })
   
rpad.calculateNext = function(node) { 
// Calculate the next Rpad element after or below the DOM node "node".
// Make sure it doesn't keep going, and 
// calculate even if it's an init block.
   rpad._doKeepGoing = false;  // turn off page traversal
   rpad.calculateNextNode(node, true);
}  

////////////////////////////
// Event handling
//   just the basics here - F9 for calculatePage
   
rpad.handleEvents = function(e) {
    var keyEvent = (dojo.render.html.ie && e.type == "keydown") || (e.type == "keypress");

    if (keyEvent && e.keyCode == e.KEY_F9 && !e.charCode) {
        // e.charCode distinguishes between function keys and characters, ie. F9 & 'x'
        // e.charCode == 0 or undefined for function keys
        rpad.calculatePage();
        e.preventDefault();
    }
    if (keyEvent && e.keyCode == e.KEY_F11 && e.ctrlKey && !e.charCode) { 
        // e.charCode distinguishes between function keys and characters, ie. F9 & 'x'
        // e.charCode == 0 or undefined for function keys

        // toggle debug:
        djConfig.isDebug = !djConfig.isDebug;
    }
    if (keyEvent && e.keyCode == e.KEY_F12 && e.ctrlKey && !e.charCode) {
        // e.charCode distinguishes between function keys and characters, ie. F9 & 'x'
        // e.charCode == 0 or undefined for function keys
        if (rpad.currentGui == "none") {
            rpad.gui2.init();
        } else {
            rpad.gui2.disable();
        }
        e.preventDefault();
    }
}

////////////////////////////
// Loading... display
// 
rpad.addLoadingDotDot = function() {
    rpad.loadingMessageNode = document.createElement('div');
    rpad.loadingMessageNode.innerHTML = "<img src='gui/wait.gif'> Page loading...";
    rpad.loadingMessageNode.id = "rpadPageLoadingMessage"
    document.body.appendChild(this.loadingMessageNode);
}   
rpad.removeLoadingDotDot = function() {
    dojo.dom.removeNode(rpad.loadingMessageNode);
}   


////////////////////////////
// R-specific initialization
//   - install R scripts
//   - install an R form handler
//   - install an R login handler (that starts R)
   
rpad.script.register("R", 
    rpad.script.serverScript("server/R_process.pl",
        function(commands, rpadInput) { 
            return {ID: rpad.dir, 
                    command: "R_commands", 
                    R_commands: commands}
        }));
   
//rpad.script.register("Rstring", 
//    rpad.script.serverScript(
//        function(commands, rpadInput) { 
//            return "server/R_process.pl?" + 
//                   "ID="+rpad.dir+
//                   "&command=R_commands&R_commands="+
//                   rpadInput.name+"='"
//                   encodeURIComponent(commands) + "'";}))
//rpad.script.register("Rvariable", 
//    rpad.script.serverScript(
//        function(commands, rpadInput) { 
//            return "server/R_process.pl?" + 
//                   "ID="+rpad.dir+
//                   "&command=R_commands&R_commands="+
//                   rpadInput.name+"="
//                   encodeURIComponent(commands);}))
   
rpad.processRForm = function(nodes) {
// Sweep through the elements of the DOM form "node" and
// generate a list of assignment commands for R.
// Then send the commands to R.
    var commands = "";
    if (!nodes.length || (nodes.nodeName && nodes.nodeName.toLowerCase() == "select")) 
        nodes = [nodes]; // make individual nodes into an array
    for (var i=0; i < nodes.length; i++) {
        var node = nodes[i];
        var name = node.getAttribute("name");
//dojo.debug(name+"X"+node.value);
        if (name == "") continue;
        var command = "";
        if (node.type == "checkbox") {
          if (node.checked)
            command = name + " = TRUE";
          else
            command = name + " = FALSE";
        } else if (node.type == "radio") {
          if (node.checked) 
            command = name + " = '" + node.value + "'";
        } else if (node.nodeName.toLowerCase() == "select" && node.selectedIndex >= 0)
          command = name + " = '" + node[node.selectedIndex].text.replace(/'/g,"\\\'") + "'"
        else if (node.type == "text" || node.type == "hidden")
          if (node.getAttribute("rpadType") == "Rvariable" && node.value != "") {
            command = name + " = " + node.value; 
          }
          else
            command = name + " = '" + node.value.replace(/'/g,"\\\'") + "'";
        commands = commands + command + "\n";
    }
    if (commands != "") {
        rpad.send("R", commands, null, nodes[0]);
    }
}  
// Connect the R form handler
dojo.event.connect(rpad, "processForm", rpad, "processRForm");
  
// Connect the R login handler
rpad.loginR = function() {
    dojo.io.bind({
        url: "server/R_process.pl?ID="+rpad.dir+"&command=login",
        load: rpad.afterLoginR,
        error: function(type, error){ dojo.debug(error); },
        mimetype: "text/html",
        timeoutSeconds: 3,         // added to make R "load-and-go" to make it work better with CGI
        timeout: rpad.afterLoginR  // just assume it worked okay
    });
}  
rpad.afterLoginR = function() {
    rpad._isRReady = true;
    rpad.calcIfReadyR();
}
rpad.calcIfReadyR = function() {
    if (rpad.pageIsLoaded && rpad.dir != "" && rpad._runState == "init" && rpad._isRReady)
        rpad.calculatePage();
}

//dojo.event.connect(rpad, "afterLogin", rpad, "afterLoginR"); // attempt to fix a cludgy bug
dojo.event.connect(dojo, "loaded", rpad, "addLoadingDotDot");
// we need both of these to happen, but we don't know which will happen first:
dojo.event.connect(rpad, "afterLogin", rpad, "loginR");
dojo.event.connect(rpad, "calculatePage", rpad, "removeLoadingDotDot");
dojo.event.connect(rpad, "afterPageCalculation", rpad, "removeLoadingDotDot");

////////////////////////////
// Initialization
//   * log in right away   
//   * set up keyboard and login events
//   * The order logic is: 
//          rpad.login - rpad.afterLogin - rpad.loginR - rpad.afterLoginR - calculatePage
//                                                                               | 
//          dojo.loaded - rpad.init - rpad.afterLoginR ---------------------------
//
//          
   
rpad.pageIsLoaded = false;  // used to determine if the page is ready for a calculation
   
rpad.login(); // login right away -- don't wait for the page to finish loading

rpad.init = function(e) {
    rpad.currentGui = "none";
    rpad.pageIsLoaded = true;
//    rpad.calcIfReadyR();
    rpad.base = document.body; // reference point for all calculations
    //rpad.login(e);
    var events = ["onkeydown", "onkeypress"];
    for (var i=0; i < events.length; i++) {
        dojo.event.connect(document, events[i], rpad, "handleEvents");
    }
    if (rpadConfig.onBeforeUnload) window.onbeforeunload = function() {return "";};
}  
//dojo.event.connect(dojo, "loaded", function() {dj_debug("loaded")})
dojo.event.connect(dojo, "loaded", rpad, "init")
dojo.event.connect(dojo, "loaded", rpad, "calcIfReadyR"); // this is out of place, but it won't work if above, either IE or Moz won't autoload.

   
////////////////////////////
// Other script registrations
//   - shell, file, javascript
   
rpad.script.register("shell", 
    rpad.script.serverScript("server/shell_process.pl",
        function(commands, rpadInput) { 
            return {ID: rpad.dir, 
                    shell_commands: commands}
        }));
rpad.script.register("file", 
    rpad.script.serverScript("server/Rpad_process.pl",
        function(commands, rpadInput) { 
            return {ID: rpad.dir, 
                    command: "savefile",
                    filename: rpadInput.getAttribute("filename"),
                    content: commands}
        }));
rpad.script.register("javascript", 
    function(commands, rpadResults, rpadInput) { 
        rpad.receive(rpadResults,
                          eval(commands).toString(), rpadInput);
    });
      

////////////////////////////
// Throbber to show a page (or tree) calculation in progress
// 
   
rpad.addPageThrobber = function() {
    rpad.throbber = document.createElement('div');
    rpad.throbber.innerHTML = "<img src='gui/wait.gif'>";
    rpad.throbber.id = "rpadPageThrobber"
    document.body.appendChild(rpad.throbber);
}   
rpad.hidePageThrobber = function() {
    if (rpad.throbber)
        rpad.throbber.style.display = "none";
}   
rpad.showPageThrobber = function() {
    if (rpad.throbber)
        rpad.throbber.style.display = "";
}

dojo.event.connect(dojo, "loaded", rpad, "addPageThrobber");
dojo.event.connect(rpad, "calculatePage", rpad, "showPageThrobber");
dojo.event.connect(rpad, "calculateTree", rpad, "showPageThrobber");
dojo.event.connect(rpad, "afterPageCalculation", rpad, "hidePageThrobber");

////////////////////////////
// A drag and drop widget - each drop zone creates a list in R containing the 
// contents of the dropped objects.
   
dojo.widget.defineWidget(
    "dojo.widget.RpadDropZone",
    dojo.widget.HtmlWidget,
{
    isContainer: true,
    listName: "browserList",
    dropsAllowed: "*",
    tagName: "dojo:rpaddropzone",
    onDrop: function(e) {},
    afterDrop: function(e) {},
    rpadType: "R",
    rpadRun: rpadConfig.rpadRun,
    
    initialize: function() {
        this.dropTarget = new dojo.dnd.HtmlDropTarget(this.domNode, this.dropsAllowed.split(','));
        dojo.event.connect(this.dropTarget, "onDrop", this, "onDrop");
        dojo.event.connect(this, "onDrop", this, "afterDrop");
        this.domNode.rpadType = this.rpadType;
        this.domNode.setAttribute("rpadType", this.rpadType);
        this.domNode.setAttribute("rpadRun", this.rpadRun);
    },
    calculate: function() {
        var command = this.listName + "= list("; 
        var isListStarted = false;
        for (var i = 0; i < this.domNode.childNodes.length; i++) {
          var chld = this.domNode.childNodes[i];
          if (chld.nodeType != 1) continue;
          var widget = rpad.utils.getWidget(chld);
          if (widget.varValue != null) {
            if (isListStarted) 
              command += ",";
            if (widget.varName != null)
              command += widget.varName + "=";
            command += "'" + widget.varValue.replace(/'/g,"\\\'") + "'"; //"
            isListStarted = true;
          }
        }
        command += ")";
        rpad.send(this.rpadType, command, null, this.domNode);
    }
})  

dojo.widget.defineWidget(
    "dojo.widget.RpadDropZoneSingle",
    dojo.widget.RpadDropZone,
{
    baseZone: "",
    onDrop: function(e) {
        // move all but the dragSource to the baseZone
        var srcNode = e.dropTarget.parentNode;
        var destNode = dojo.byId(this.baseZone);
        while (srcNode.hasChildNodes() && srcNode.firstChild != e.dragSource.domNode) {
            destNode.appendChild(srcNode.firstChild);
        }
        while (e.dragSource.domNode.nextSibling) {
            destNode.appendChild(e.dragSource.domNode.nextSibling);
        }
        rpad.calculatePage();
    }
});

dojo.widget.defineWidget(
    "dojo.widget.RpadDragVariable",
    dojo.widget.HtmlWidget,
{
    varName: null,
    varValue: "varvalue",
    dragName: "drag1",
    tagName: "dojo:rpaddragvariable",
    dropsAllowed: "",
    dropTarget: null,
    initialize: function() {
        this.dragSource = new dojo.dnd.HtmlDragSource(this.domNode, this.dragName);
        this.domNode.innerHTML = this.varValue + " ";
        if (this.dropsAllowed != "") {
          this.dropTarget = new dojo.dnd.HtmlDropTarget(this.domNode, this.dropsAllowed.split(','));
          if (this.onDrop != null)
            this.dropTarget.onDrop = this.onDrop;
        }
    }
}); 











   
////////////////////////////
// Rpad gui
//   This gui is like the "lite" editor in Rpad 0.9.6. It relies on 
//   the contentEditable feature of the browser. This is only supported 
//   on IE and Firefox with the Mozile plugin. It also sets up a menu
//   bar using the Menu2 dojo widgets. The whole page is editable.
//   Several routines for handling selections and inserting and retrieving
//   HTML come from HTMLArea.
// It's public methods are:
//   init() - initialize this gui
//   insertHtml(html) - insert the given HTML string at the current selection location
//   saveAs() - prompt for a filename and send to the server for saving
//   insertRadioButton(), insertInput(), insertCheckbox() - insert form elements

rpad.gui = {};
   
rpad.gui._addDivWrapper = function() {
// Add a wrapper around the whole document body.
    var d = document.body;
    this.wrapper = document.createElement('div');
    this.wrapper.setAttribute('contentEditable',true);
    this.wrapper.id = "Rpad_div";
    d.insertBefore(this.wrapper, d.firstChild);
    while (d.firstChild.nextSibling) // move the body's children
        this.wrapper.appendChild(d.firstChild.nextSibling);
    rpad.base = rpad.gui.wrapper; // reset the calculation reference
}  
   
rpad.gui._isInRpadInput = function() {
    var p = rpad.gui._getParentElement();
    var result = false;
    while (p && (p.nodeType == 1) && (p.tagName != 'BODY')) {
        result = result || 
                    (p.dojoAttachPoint="rpadWrapper" && p.tagName != 'INPUT' && p.tagName != 'SELECT' && p.tagName != 'TEXTAREA');
        p = p.parentNode;
    }
    return result;
}  
   
rpad.gui.insertNodeAtSelection = function(toBeInserted) {
// based on HTMLArea code - see the HTMLArea copyright notice
    if (!dojo.render.html.ie) {
        var sel = this._getSelection();
        var range = this._createRange(sel);
        // remove the current selection
        sel.removeAllRanges();
        range.deleteContents();
        var node = range.startContainer;
        var pos = range.startOffset;
        switch (node.nodeType) {
            case 3: // Node.TEXT_NODE
            // we have to split it at the caret position.
            if (toBeInserted.nodeType == 3) {
                // do optimized insertion
                node.insertData(pos, toBeInserted.data);
                range = this._createRange();
                range.setEnd(node, pos + toBeInserted.length);
                range.setStart(node, pos + toBeInserted.length);
                sel.addRange(range);
            } else {
                node = node.splitText(pos);
                var selnode = toBeInserted;
                if (toBeInserted.nodeType == 11 /* Node.DOCUMENT_FRAGMENT_NODE */) {
                    selnode = selnode.firstChild;
                }
                node.parentNode.insertBefore(toBeInserted, node);
                this._selectNodeContents(selnode);
//              this.updateToolbar();
            }
            break;
            case 1: // Node.ELEMENT_NODE
            var selnode = toBeInserted;
            if (toBeInserted.nodeType == 11 /* Node.DOCUMENT_FRAGMENT_NODE */) {
                selnode = selnode.firstChild;
            }
            node.insertBefore(toBeInserted, node.childNodes[pos]);
            this._selectNodeContents(selnode);
//          this.updateToolbar();
            break;
        }
    } else {
        return null;    // this function not yet used for IE <FIXME>
    }
}

rpad.gui.insertHtml = function(html) { 
// based on HTMLArea code - see the HTMLArea copyright notice
    var sel = this._getSelection();
    var range = this._createRange(sel);
    if (dojo.render.html.ie) {
        range.pasteHTML('<div id="rpadtempspan">' + html + '</div>');
        //rpad.gui._getParentElement()); // works for textarea, but not for pre
        var wrapper = dojo.byId("rpadtempspan");
        rpad.utils.parseNode(wrapper);
        // remove the wrapper
        while(wrapper.hasChildNodes()){
            dojo.dom.insertBefore(wrapper.firstChild, wrapper);
        }
        dojo.dom.removeNode(wrapper);
    } else {
        // construct a new document fragment with the given HTML
        var fragment = document.createDocumentFragment();
        var div = document.createElement("div");
        div.innerHTML = html;
        rpad.utils.parseNode(div);
        while (div.firstChild) {
            // the following call also removes the node from div
            fragment.appendChild(div.firstChild);
        }
        // this also removes the selection
        var node = this.insertNodeAtSelection(fragment);
    }
}; 
// returns the current selection object
rpad.gui._getSelection = function() {
// based on HTMLArea code - see the HTMLArea copyright notice
    if (dojo.render.html.ie) {
        return document.selection;
    } else {
        return rpad._activeWindow.getSelection();
    }
}; 
   
// returns a range for the current selection
rpad.gui._createRange = function(sel) {
// based on HTMLArea code - see the HTMLArea copyright notice
    if (dojo.render.html.ie) {
        return sel.createRange();
    } else {
        if (typeof sel != "undefined") {
            try {
                return sel.getRangeAt(0);
            } catch(e) {
                return document.createRange();
            }
        } else {
            return document.createRange();
        }
    }
}; 
// Returns the deepest node that contains both endpoints of the selection.
rpad.gui._getParentElement = function() {
// based on HTMLArea code - see the HTMLArea copyright notice
    var sel = this._getSelection();
    var range = this._createRange(sel);
    if (dojo.render.html.ie) {
        switch (sel.type) {
            case "Text":
            case "None":
            // It seems that even for selection of type "None",
            // there _is_ a parent element and it's value is not
            // only correct, but very important to us.  MSIE is
            // certainly the buggiest browser in the world and I
            // wonder, God, how can Earth stand it?
            return range.parentElement();
            case "Control":
            return range.item(0);
            default:
            return document.body;
        }
    } else try {
        var p = range.commonAncestorContainer;
        if (!range.collapsed && range.startContainer == range.endContainer &&
            range.startOffset - range.endOffset <= 1 && range.startContainer.hasChildNodes())
            p = range.startContainer.childNodes[range.startOffset];
        /*
        alert(range.startContainer + ":" + range.startOffset + "\n" +
              range.endContainer + ":" + range.endOffset);
        */
        while (p.nodeType == 3) {
            p = p.parentNode;
        }
        return p;
    } catch (e) {
        return null;
    }
}; 

rpad.gui._selectNodeContents = function(node, pos) {
// based on HTMLArea code - see the HTMLArea copyright notice
//	this.forceRedraw();
	var range;
	var collapsed = (typeof pos != "undefined");
    if (dojo.render.html.ie) {
		range = document.body.createTextRange();
		range.moveToElementText(node);
		(collapsed) && range.collapse(pos);
		range.select();
	} else {
		var sel = this._getSelection();
		range = document.createRange();
		range.selectNodeContents(node);
		(collapsed) && range.collapse(pos);
		sel.removeAllRanges();
		sel.addRange(range);
	}
};


rpad.gui.htmlEncode = function(str) {
// based on HTMLArea code - see the HTMLArea copyright notice
    // we don't need regexp for that, but.. so be it for now.
    str = str.replace(/&/ig, "&amp;");
    str = str.replace(/</ig, "&lt;");
    str = str.replace(/>/ig, "&gt;");
    str = str.replace(/\x22/ig, "&quot;");
    // \x22 means '"' -- we use hex reprezentation so that we don't disturb
    // JS compressors (well, at least mine fails.. ;)
    return str;
};

rpad.gui.needsClosingTag = function(el) {
// based on HTMLArea code - see the HTMLArea copyright notice
    var closingTags = " head script style div span tr td tbody table em strong font a title ";
    return (closingTags.indexOf(" " + el.tagName.toLowerCase() + " ") != -1);
};

// based on HTMLArea code - see the HTMLArea copyright notice
rpad.gui.RE_tagName = /(<\/|<)\s*([^ \t\n>]+)/ig;

// based on HTMLArea code - see the HTMLArea copyright notice
rpad.gui.baseURL = document.baseURI || document.URL;
if (rpad.gui.baseURL && rpad.gui.baseURL.match(/(.*)\/([^\/]+)/))
    rpad.gui.baseURL = RegExp.$1 + "/";

rpad.gui.stripBaseURL = function(string) {
// based on HTMLArea code - see the HTMLArea copyright notice
    var baseurl = rpad.gui.baseURL; 

    // strip to last directory in case baseurl points to a file
    baseurl = baseurl.replace(/[^\/]+$/, '');
    var basere = new RegExp(baseurl);
    string = string.replace(basere, "");

    // strip host-part of URL which is added by MSIE to links relative to server root
    baseurl = baseurl.replace(/^(https?:\/\/[^\/]+)(.*)$/, '$1');
    basere = new RegExp(baseurl);
    return string.replace(basere, "");
};

rpad.gui.getHTML = function(root) {
// based on HTMLArea code - see the HTMLArea copyright notice
    var html = "";
    switch (root.nodeType) {
        case 1: // Node.ELEMENT_NODE
        case 9: // Node.
        case 11: // Node.DOCUMENT_FRAGMENT_NODE
            var closed;
            var i;
            var root_tag = (root.nodeType == 1) ? root.tagName.toLowerCase() : '';
            var w = rpad.utils.getWidget(root);
            if (dojo.render.html.ie && root_tag == "head") {
                html += "<head>";
                // lowercasize
                var save_multiline = RegExp.multiline;
                RegExp.multiline = true;
                var txt = root.innerHTML.replace(rpad.gui.RE_tagName, function(str, p1, p2) {
                    return p1 + p2.toLowerCase();
                });
                RegExp.multiline = save_multiline;
                html += txt;
                html += "</head>";
                break;
            } else if (w) {
                if (w.getHtml) {
                    return w.getHtml();
                } else { // serialize widget and write that out ... 
                    // 
                    return "<div>WARNING: Dojo widget '" + w.widgetType + "' does not support save</div>";
//                    dojo.require("dojo.json");
//                    var storable = dojo.json.serialize(w);
//dj_debug(storable);
                }
            } else {
                if (root.tagName) {
                    // skip nodes that dojo creates that we don't want:
                    if (/^dojo/i.test(root.id) || root.getAttribute("rpadignore"))
                        return "";
                    closed = (!(root.hasChildNodes() || rpad.gui.needsClosingTag(root)));
                    html = "<" + root.tagName.toLowerCase();
                    var attrs = root.attributes;
                    for (i = 0; i < attrs.length; ++i) {
                        var a = attrs.item(i);
                        // if (!a.specified) {
                        //bugfix: http://www.interactivetools.com/forum/forum.cgi?do=post_view_printable;post=23072;guest=5256845&t=search_engine
                        if (!a.specified && !(a.nodeName.toLowerCase() == "value" && a.nodeValue != "")
                                         && !(a.nodeName.toLowerCase() == "name" && a.nodeValue != "")) {
                            continue;
                        }
                        var name = a.nodeName.toLowerCase();
                        if (/_moz|contenteditable/.test(name)) {
                            // avoid certain attributes
                        // Don't avoid these attributes!!
                        //                  continue;
                        }
                        var value;
                        if (name != "style") {
                            // IE5.5 reports 25 when cellSpacing is
                            // 1; other values might be doomed too.
                            // For this reason we extract the
                            // values directly from the root node.
                            //
                            // Using Gecko the values of href and src are converted to absolute links
                            // unless we get them using nodeValue()
                            if (typeof root[a.nodeName] != "undefined" && name != "href" && name != "src") {
        //                      value = root[a.nodeName];
                                value = a.nodeValue;
                            } else {
                                value = a.nodeValue;
                                // IE seems not willing to return the original values - it converts to absolute
                                // links using a.nodeValue, a.value, a.stringValue, root.getAttribute("href")
                                // So we have to strip the baseurl manually -/
                                if (dojo.render.html.ie && (name == "href" || name == "src")) {
                                    value = rpad.gui.stripBaseURL(value);
                                }
                            }
                        } else { // IE fails to put style in attributes list
                            // FIXME: cssText reported by IE is UPPERCASE
                            value = root.style.cssText;
                        }
                        if (/(_moz|^$)/.test(value)) {
                            // Mozilla reports some special tags
                            // here; we don't need them.
                            continue;
                        }
                        html += " " + name + '="' + value + '"';
                    }
                    html += closed ? " />" : ">";
                    if (dojo.render.html.ie && !closed && root.tagName.toLowerCase() == "script") {
                        html += root.text;
                    }
                }
            }
            for (i = root.firstChild; i; i = i.nextSibling) {
                html += rpad.gui.getHTML(i);
            }
            if (!closed && root.tagName) {
                html += "</" + root.tagName.toLowerCase() + ">";
            }
            break;
        case 3: // Node.TEXT_NODE
//            html = rpad.gui.htmlEncode(root.data);
            html = root.data;
            break;
        case 8: // Node.COMMENT_NODE
            html = "<!--" + root.data + "-->";
            break;      // skip comments, for now.
        case 10: // Node.
            html = "<!DOCTYPE " + root.name + ' PUBLIC "' + root.publicId + '">';
            break;      
    }
    return html;
};

rpad.gui.saveAs = function() {
    var contents = rpad.gui.getHTML(document).replace(/\r\n/g,"\n");
    var filename = prompt('SAVE: Enter the file name (without extension)','test') + ".Rpad";
    if (rpad.dir == "") {
        alert("Can't connect to the server");
        return;
    }
    dojo.io.bind({
        url: "server/Rpad_process.pl",
        content: {command: "savefileinbase", filename: filename, 
                  content: contents},
        method: "POST",
        load: function(type, data, evt){
                  window.status = 'Rpad page saved';
                  window.open(filename);
                  rpad.gui.afterSaveAs()
              },
        error: function(type, error){ dj_debug("ERROR");_dump(error); },
        mimetype: "text/html"});
}  
rpad.gui.afterSaveAs = function(type, data, evt){
//      window.status = 'Rpad page saved';
//      window.open(filename);
}

rpad.gui._isInRpadDiv = function() {
    var parent = rpad.gui._getParentElement();
   
    // find the top level node 2 levels below the BODY
    while (parent.tagName.toLowerCase() != "body") {
      parent = parent.parentNode;
      if (parent.id == 'Rpad_div') return true;
    }
    return false;
}  
 
rpad.gui.activeWidget = function() {
    var p = rpad.gui._getParentElement();
    var result = false;
    while (p && (p.nodeType == 1) && (p.tagName != 'BODY')) {
        result = rpad.utils.getWidget(p);
        if (rpad.utils.getWidget(p)) return result;
        p = p.parentNode;
    }
    return false;
}  
   
rpad.gui.insertRpad = function(Rpadtype) {
  if (!rpad.gui._isInRpadDiv()) return;
  rpad.gui.insertHtml("<pre dojoType='Rpad' rpadType='" + Rpadtype + "'># Enter code or file data here</pre>");
}  
   
rpad.gui.insertTextarea = function(Rpadtype) {
  if (!rpad.gui._isInRpadDiv()) return;
  rpad.gui.insertHtml("<span contenteditable='false'><textarea dojoType='Rpad' rpadType='" + Rpadtype + "' rows='5' cols='80'># Enter code or file data here</textarea></span>");
}  
   
rpad.gui.insertInput = function() {
//  if (!rpad.gui._isInRpadDiv()) return;
  var name = prompt('INPUT: Enter the name of the variable:','var1');
  rpad.gui.insertHtml("<span contenteditable='false' class='RpadWrapper'><input class='Rpad_input' rpadType='Rstring'" + 
                      " name='" + name + "'>&nbsp; </input></span>");
}  
   
rpad.gui.insertSpan = function(Rpadtype) {
  if (!rpad.gui._isInRpadDiv()) return;
  rpad.gui.insertHtml("<span class='Rpad_input' rpadType='" + Rpadtype + "'>&nbsp; </span>");
}  
   
rpad.gui.insertRadioButton = function() {
//  if (!rpad.gui._isInRpadDiv()) return;
  var commonName = prompt('RADIO BUTTON: Enter the name of the radio button set:','radioGroup');
  var variableName = prompt('RADIO BUTTON: Enter the specific variable name:','option1');
  rpad.gui.insertHtml('<span contentEditable="false" onMouseDown="this.updateStatusArea"><input type="radio" name="' +
                      commonName + '" value="' + variableName + '" ></input></span>');
}  
   
rpad.gui.insertCheckbox = function() {
//  if (!rpad.gui._isInRpadDiv()) return;
  var name = prompt('CHECKBOX: Enter the name of the checkbox variable:','isChecked');
  rpad.gui.insertHtml('<span contentEditable="false"><input type="checkbox" name="' +
                      name + '" ></input></span>');
}  
   
rpad.utils.cloneObject = function(obj) {
// function that returns a clone of the given object
// from HTMLArea
    var newObj = new Object;
   
    // check for array objects
    if (obj.constructor.toString().indexOf("function Array(") == 1) {
        newObj = obj.constructor();
    }
   
    // check for function objects (as usual, IE is messed up)
    if (obj.constructor.toString().indexOf("function Function(") == 1) {
        newObj = obj; // just copy reference to it
    } else for (var n in obj) {
        var node = obj[n];
        if (typeof node == 'object') { newObj[n] = rpad.utils.cloneObject(node); }
        else                         { newObj[n] = node; }
    }
   
    return newObj;
}; 
   
rpad.gui.topBar = {} // don't think we need a real dojo widget here
rpad.gui.topBar.create = function() { 
    this.wrapper = document.createElement("div"); 
    this.wrapper.setAttribute('contentEditable',false);
    this.wrapper.id = "Rpad_topBar";
    this.wrapper.innerHTML = '<table width="100%" contentEditable="false"><td><div id="Rpad_menuBar" unselectable="on" style="-moz-user-select:none;">a</div></td><td align="right"><div id="Rpad_statusArea" style="fontsize:3 -moz-user-focus: normal; -moz-user-select: normal;"></div></td></table>';
    document.body.insertBefore(this.wrapper, document.body.firstChild);                                                                                                                             
    document.body.setAttribute('unselectable', 'On');
    this.statusArea = document.getElementById("Rpad_statusArea");
    this.menuBar = document.getElementById("Rpad_menuBar");
    this.selectType = document.createElement("select");
    for (var s in rpad.script.registered()) {
        var o = document.createElement("OPTION");
        var t = document.createTextNode(s);
        o.setAttribute("value",s);
        o.appendChild(t);
        this.selectType.appendChild(o);
    }
    this.selectType.style.display = "none";
    this.statusArea.appendChild(this.selectType);

    this.inputName = document.createElement("input");
    this.inputName.style.display = "none";
    this.statusArea.appendChild(this.inputName);
    this.inputValue = document.createElement("input");
    this.inputName.style.display = "none";
    this.statusArea.appendChild(this.inputValue);
    this.createMenu();
}
dojo.require("dojo.widget.Menu2");
//dojo.require("dojo.widget.DropdownButton");
rpad.gui.topBar.createMenu = function() { // load and parse the Rpad main menu
    dojo.io.bind({
        url: "gui/RpadMenu.html",
        mimetype: "text/html",
        handler: function(type, data, e) {
            if(type == "load") {
                rpad.gui.topBar.menuBar.innerHTML = data;
                rpad.utils.parseNode(rpad.gui.topBar.menuBar);
            }
        }
    });
}
rpad.gui.topBar.update = function(node) {
    var parent = rpad.gui._getParentElement();
    // try an INPUT or SELECT
    if (node.tagName == 'SELECT' || node.tagName == 'INPUT' || node.tagName == 'TEXTAREA') 
        parent = node;
    window.status = parent.tagName+parent.className + parent.name;

    var widget = rpad.gui.activeWidget();
    if (widget) {
        var i = 0;
        for (var s in rpad.script.registered()) {
            if (s == widget.rpadType) {
                this.selectType.selectedIndex = i;
            }
            i++;
        }
        this.selectType.onchange = function() {widget.rpadType = this.value;}; // use connect?
        this.selectType.style.display = "";
    } else {
        this.selectType.style.display = "none";
    }
    var canHaveName = parent.tagName.toLowerCase() == "input" || 
                      parent.tagName.toLowerCase() == "select" || 
                      (widget && widget.rpadType == "file") || 
                      parent.getAttribute("rpadType") == "Rstring" || 
                      parent.getAttribute("rpadType") == "Rvariable";
    if (canHaveName) {
    this.inputName.style.display = "";
        this.inputName.value = parent.getAttribute("name");
        this.inputName.onchange = function() {parent.setAttribute("name",this.value);};
        this.inputName.onblur = function() {parent.setAttribute("name",this.value);};
    } else {
        this.inputName.style.display = "none";
    }
    var canHaveValue = parent.tagName.toLowerCase() == "input" &&
                       parent.type.toLowerCase() == "radio";
    if (canHaveValue) {
        this.inputValue.value = parent.getAttribute("value");
        this.inputValue.onchange = function() {parent.setAttribute("value",this.value);};
        this.inputValue.onblur = function() {parent.setAttribute("value",this.value);};
        this.inputValue.style.display = "";
    } else {
        this.inputValue.style.display = "none";
    }
}
rpad.gui.calculateSelection = function() {
    var widget = rpad.gui.activeWidget();
    if (widget) {
        widget.calculate();
    }
}
rpad.gui.toggleVisibility = function() {
    var widget = rpad.gui.activeWidget();
    if (widget) {
        widget.toggleVisibility();
    }
}
rpad.gui.unhideAllCode = function() {
    var widgets = dojo.widget.getWidgetsByType("Rpad");
    for (var i=0; i<widgets.length; i++) {
        widgets[i].show();
    }
}

/** Event handler.
 * This function also handles key bindings. */
rpad.gui.handleEvents = function(e) {
    var editor = this;
    var keyEvent = (dojo.render.html.ie && e.type == "keydown") || (e.type == "keypress");
//    var keyEvent = (e.type == "keypress");
    if (keyEvent && e.ctrlKey) {  // CONTROL KEYS
        var sel = null;
        var range = null;
        var key = e.charCode > 0 ? String.fromCharCode(e.charCode) : null;
        var cmd = null;
        var value = null;
        switch (key) {
            case 'a':
            if (!dojo.render.html.ie) {
                // KEY select all
                sel = this._getSelection();
                sel.removeAllRanges();
                range = this._createRange();
                range.selectNodeContents(document.body);
                sel.addRange(range);
                e.preventDefault();
            }
            break;
 
            // simple key commands follow
 
            case 'b': cmd = "bold"; break;
            case 'i': cmd = "italic"; break;
            case 'u': cmd = "underline"; break;
            case 's': rpad.gui.save(); e.preventDefault(); break;
            case 'l': cmd = "justifyleft"; break;
            case 'e': cmd = "justifycenter"; break;
//          case 'r': cmd = "justifyright"; break;
            case 'j': cmd = "justifyfull"; break;
            case 'z': cmd = "undo"; break;
            case 'y': cmd = "redo"; break;
//          case 'v': cmd = "paste"; break;
 
            case '0': cmd = "killword"; break;
 
            // headings
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            cmd = "formatblock";
            value = "h" + key;
            if (dojo.render.html.ie) {
                value = "<" + value + ">";
            }
            break;
        }
        if (cmd) {
            // execute simple command
            document.execCommand(cmd, false, value);
            e.preventDefault();
        }
    }
    else if (keyEvent) {
        // other keys here
        switch (e.keyCode) {
            case e.KEY_ENTER: // KEY enter
                if (rpad.gui._isInRpadInput()) {
                    rpad.gui.insertHtml("<br/>");
                    e.preventDefault();
                    e.stopPropagation();
                }
            break;
 
            case e.KEY_BACKSPACE: // BACKSPACE key - disable for Mozilla/Mozile
                 if (!dojo.render.html.ie && e.originalTarget.nodeName != "INPUT" && e.originalTarget.nodeName != "TEXTAREA") { 
                   e.preventDefault();
                 }
            break;
            case e.KEY_F8:
                    var isF8 = (!dojo.render.html.ie || e.type == "keydown") ;
                    if (isF8) { // This test distinguishes between F8 & 'x'
                      rpad.gui.calculateSelection();
                      e.preventDefault();
                    }
                break;
            case e.KEY_F2:
                    var isF2 = (!dojo.render.html.ie || e.type == "keydown") ;
                    if (isF2) { // This test distinguishes between F2 & 'x'
                        rpad.gui.toggleVisibility();
                        e.preventDefault();
                    }
                break;
        }
    }
//editor.updateStatusArea(e);
    // update the toolbar state after some time
    if (rpad.gui.topBar._timerToolbar) {
        clearTimeout(rpad.gui.topBar._timerToolbar);
    }
    var target = dojo.render.html.ie ? e.srcElement : e.target;
    rpad.gui.topBar._timerToolbar = setTimeout(function() {
//dj_debug('key');
        rpad.gui.topBar.update(target);
        rpad.gui.topBar._timerToolbar = null;
    }, 50);
};

rpad.gui.init = function(e) {
    rpad.gui._addDivWrapper();
    rpad.gui.topBar.create();
    var events = ["onkeydown", "onkeypress", "onmousedown", "onmouseup", "ondrag"];
    for (var i=0; i < events.length; i++) {
//        dojo.event.connect(document, events[i], rpad.gui, "handleEvents");
        dojo.event.connect(rpad.base, events[i], rpad.gui, "handleEvents");
    }
//    setInterval(rpad.gui.topBar.update, 500);
}

if (rpadConfig.gui == "standard") {
    dojo.event.connect(rpad, "init", rpad.gui, "init");
}


////////////////////////////
// Rpad alternate gui 
// The user can click on Rpad widgets to edit them or use the keyboard to navigate up and down.
// It uses the dojo RichText editor if supported by the browser.
// This defines the rpadConfig.gui == "alternate"
// It also extends the base Rpad widget to allow more interactivity.
// It's public methods are:
//   init() - initialize this gui
//   disable() - disable this gui

dojo.require("dojo.widget.Editor");
dojo.require("dojo.dnd.*");

rpad.gui2 = {};

rpad.utils.hasChildElements = function(node) {
    return node.getElementsByTagName("*").length > 0;
}

rpad.gui2.initDropTargets = function(node) {
    var lis = node.getElementsByTagName("*");
   	for(var i=0; i<lis.length; i++){
        if (rpad.utils.hasChildElements(lis[i])) {
    		new dojo.dnd.HtmlDropTarget(lis[i], ["div", "span", "ul", "tr"]);
        }
	}
}

rpad.gui2.init = function() {
    rpad.currentGui = "alternate";
    var events = ["onkeydown", "onkeypress", "onmousedown", "onmouseup", "ondrag"];
    for (var i=0; i < events.length; i++) {
        dojo.event.connect("before", document, events[i], rpad.gui2, "handleEvents");
    }
//    rpad.gui2.initMouseEvents();
    dojo.event.connect(document.body, "onmouseover", rpad.gui2, "onmouseover");
    dojo.event.connect(document.body, "onmouseout", rpad.gui2, "onmouseout");
    dojo.event.connect(document.body, "onclick", rpad.gui2, "onclick");
    dojo.event.connect(document.body, "ondblclick", rpad.gui2, "ondblclick");
    // Create the nested drop targets
    dojo.dnd.dragManager.nestedTargets = true;
    new dojo.dnd.HtmlDropTarget(document.body, ["*"]);
    rpad.gui2.initDropTargets(document.body);
    // widgetBar
    rpad.gui2.widgetBarNode = document.createElement("div");
    rpad.gui2.widgetBarNode.rpadIgnore = "true";
    document.body.appendChild(rpad.gui2.widgetBarNode);
    rpad.gui2.widgetBar = dojo.widget.createWidget("dojo:RpadMenu", {}, rpad.gui2.widgetBarNode);
    rpad.gui2.activateNode(rpad.gui2.nodeRight(rpad.base));
}

rpad.gui2.disable = function() {
    if (rpad.gui2.editing)
        rpad.gui2.finishRichtextEdit();
    if (rpad.gui2.activeRpadWidget && rpad.gui2.activeRpadWidget.editing) { 
        rpad.gui2.activeRpadWidget.saveEdit();
        rpad.gui2.activeRpadWidget.endEdit();
    }
    rpad.currentGui = "none";
    var events = ["onkeydown", "onkeypress", "onmousedown", "onmouseup", "ondrag"];
    for (var i=0; i < events.length; i++) {
        dojo.event.disconnect(document, events[i], rpad.gui2, "handleEvents");
    }
    dojo.event.disconnect(document.body, "onmouseover", rpad.gui2, "onmouseover");
    dojo.event.disconnect(document.body, "onmouseout", rpad.gui2, "onmouseout");
    dojo.event.disconnect(document.body, "onclick", rpad.gui2, "onclick");
    dojo.event.disconnect(document.body, "ondblclick", rpad.gui2, "ondblclick");
    rpad.gui2.deactivateNode(rpad.gui2.activeNode);
}

if (rpadConfig.gui == "alternate") {
    dojo.event.connect(rpad, "init", rpad.gui2, "init");
}

// Extend the base Rpad widget with methods needed for gui2.
// It has an internal self-adjusting textarea used for editing Rpad contents
// It's public methods are:
//    appendNew(): append another Rpad widget of the same type
//    beginEdit(), saveEdit(), endEdit(): enable, save, and disable editing
//    updateTextarea(): readjust sizing of textarea
dojo.lang.extend(dojo.widget.Rpad, {
    textValue: "",
    minHeight: 30,
    maxHeight: 500,
    appendNew: function(e) { // append a new Rpad widget if one doesn't follow
        if (rpad.utils.getRpadWidget(dojo.dom.nextElement(this.domNode))) {
            return;
        }
        var div = document.createElement("span");
        div.innerHTML = "<pre dojoType='Rpad' rpadType='" + this.rpadType + "'> </pre>";
        rpad.utils.parseNode(div);
        dojo.dom.insertAfter(div.firstChild, this.domNode);
    },
    beginEdit: function(e){
        if (this.editing || this.rpadInput.tagName == "TEXTAREA" ) { return; } // don't edit if editing or if it's already a textarea
        this.editing = true;

        var ee = this.textarea;

        ee.style.display = "";
        ee.value = rpad.utils.getTextContent(this.rpadInput);
        ee.style.fontSize = dojo.html.getStyle(this.rpadInput, "font-size");
        ee.style.fontWeight = dojo.html.getStyle(this.rpadInput, "font-weight");
        ee.style.fontStyle = dojo.html.getStyle(this.rpadInput, "font-style");
        //this.text.style.fontFamily = dojo.dom.getStyle(this.rpadInput, "font-family");

        ee.style.width = "100%";
        ee.style.height = Math.min(this.maxHeight,
                                   Math.max(dojo.html.getInnerHeight(this.rpadInput), 
                                            this.minHeight)) +
                          "px";
        this.rpadInput.style.display = "none";
        ee.focus();
    },

    updateTextarea: function(e){
        var ee = this.textarea;
        ee.style.height = Math.min(this.maxHeight,
                                   dojo.html.getInnerHeight(this.textarea) + 30) +
                          "px";
    },

    saveEdit: function(e){
        if (dojo.render.html.ie) { // without this, IE messes up whitespace (http://www.quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html)
//            this.rpadInput.outerHTML = "<pre class='Rpad_input'>" + this.textarea.value + "</pre>";
//            this.rpadInput.rpadWidget = this;
//            this.rpadInput.innerHTML = this.textarea.value.replace(/\n/g,"\n<BR/>"); 
//            this.rpadInput.innerText = this.textarea.value; // messes up on spaces
            // stuff it right into the first textnode:
            this.rpadInput.firstChild.nodeValue = this.textarea.value;
        } else {
            this.rpadInput.innerHTML = this.textarea.value;
        }
    },

    endEdit: function(e){
        this.editing = false;
        this.rpadInput.style.display = "";
        this.textarea.style.display = "none";
    },

    onClick: function(e) {
        this.beginEdit(e);
    },
    getHtml: function() { // get a HTML representation of the widget
        return "";
    }
});


rpad.gui2.hasWidgetChildren = function(node) {
// true if "node" has any dojo widgets as descendents 
    for (var chld = node.firstChild;chld;chld=chld.nextSibling) {
        if (rpad.utils.getWidget(chld) || rpad.gui2.hasWidgetChildren(chld)) 
            return true;
    } 
    return false;
}

function _img(name) {
	return dojo.uri.dojoUri(name + ".gif").toString();
}

rpad.gui2.startRichtextEdit = function(e) {
    if (rpad.gui2.hasWidgetChildren(rpad.gui2.activeNode)) return;
    rpad.gui2.editing = true;
    rpad.gui2.editorWrapper = document.createElement("div");
    dojo.dom.insertBefore(rpad.gui2.editorWrapper, rpad.gui2.activeNode);
    rpad.gui2.editorWrapper.appendChild(rpad.gui2.activeNode);
    rpad.gui2.deactivateNode(rpad.gui2.activeNode);
    rpad.gui2.activateNode(rpad.gui2.editorWrapper);
    if (!rpad.gui2.richEditor) {
        rpad.gui2.richEditor = dojo.widget.createWidget("Editor", {}, rpad.gui2.editorWrapper);
        setTimeout(function(){  // wait for the editor to be ready
            rpad.gui2.richText = rpad.gui2.richEditor._richText;
            rpad.gui2.richToolbarContainer = rpad.gui2.richEditor._toolbarContainer;
            rpad.gui2.richEditor.addItem("|"); // works, but only for the 1st toolbar
            //rpad.gui2.richText.addItem(_img("radio")); // doesn't work, don't know why
            // for some reason, the toolbars aren't getting killed; each one builds up, so this is a kludge:
            var btn = rpad.gui2.richEditor._toolbars[0].addChild(_img("input"));
            dojo.event.connect(btn, "onClick", rpad.gui, "insertInput");
            var btn = rpad.gui2.richEditor._toolbars[0].addChild(_img("radio"));
            dojo.event.connect(btn, "onClick", rpad.gui, "insertRadioButton");
            var btn = rpad.gui2.richEditor._toolbars[0].addChild(_img("checkbox"));
            dojo.event.connect(btn, "onClick", rpad.gui, "insertCheckbox");
            var btn = rpad.gui2.richEditor._toolbars[0].addChild(_img("button"));
            dojo.event.connect(btn, "onClick", rpad.gui, "insertButton");
            }, 20);
        dojo.event.connect(rpad.gui2.richEditor, "onClose", rpad.gui2, "finishRichtextEdit");

    } else {
        rpad.gui2.richToolbarContainer.domNode.style.display = "";
        rpad.gui2.richText = dojo.widget.createWidget("RichText", {}, rpad.gui2.editorWrapper);
		dojo.html.insertBefore(rpad.gui2.richToolbarContainer.domNode, rpad.gui2.richText.domNode);
        rpad.gui2.richEditor.setRichText(rpad.gui2.richText);
    }
    // onClose: remove toolbar & iframe
    // add ESCAPE to the keyhandler
    setTimeout(function(){  // wait for the editor to be ready
        dojo.event.connect(rpad.gui2.richText, "onKeyPress",
            function(e) {
                if (e.keyCode == e.KEY_ESCAPE) {
                    rpad.gui2.richText.close(true);
                    e.preventDefault();
                }
            });
        if (rpad.gui2.richText.iframe)
            rpad._activeWindow = rpad.gui2.richText.iframe.contentWindow; // point to the iframe
        }, 40);
}

rpad.gui2.finishRichtextEdit = function(e) {
    rpad.gui2.richToolbarContainer.domNode.style.display = "none";
    rpad._activeWindow = window; 
    rpad.gui2.editing = false;
    if (rpad.gui2.richText.iframe)
        dojo.dom.removeNode(rpad.gui2.richText.iframe);
    rpad.gui2.initDropTargets(rpad.gui2.editorWrapper);
    // remove the wrapper
    rpad.gui2.activateNode(rpad.gui2.editorWrapper.firstChild);
    while(rpad.gui2.editorWrapper.hasChildNodes()){
        dojo.dom.insertBefore(rpad.gui2.editorWrapper.firstChild, rpad.gui2.editorWrapper);
    }
    dojo.dom.removeNode(rpad.gui2.editorWrapper);
}

rpad.gui2.handleEvents = function(e) {
    var keyEvent = (dojo.render.html.ie && e.type == "keydown") || (e.type == "keypress");
    if (keyEvent) {
        // e.charCode distinguishes between function keys and characters, ie. F9 & 'x'
        // e.charCode == 0 or undefined for function keys
        switch (e.keyCode) {
            case e.KEY_ENTER: 
                if (rpad.gui2.activeRpadWidget) { 
                    if (e.ctrlKey || e.shiftKey) {
                        if (rpad.gui2.activeRpadWidget) { 
                            if (rpad.gui2.activeRpadWidget.editing) {
                                rpad.gui2.activeRpadWidget.saveEdit();
                                rpad.gui2.activeRpadWidget.endEdit();
                            }
                            rpad.gui2.activeRpadWidget.calculate();
                            rpad.gui2.activeRpadWidget.appendNew();
                            rpad.gui2.goDown();
                            rpad.gui2._scroll(rpad.gui2.activeNode);
                            rpad.gui2.activeRpadWidget.beginEdit();
                            e.preventDefault();
                            return;
                        }
                    }
                    if (rpad.gui2.activeRpadWidget.editing) {
                        rpad.gui2.activeRpadWidget.updateTextarea(e);
                    } else { // begin Rpad widget editing
                        rpad.gui2.activeRpadWidget.beginEdit(e);
                        e.preventDefault();
                    }
                } else { // use the rich text editor
                    if (!rpad.gui2.editing && (dojo.render.html.ie || dojo.render.html.moz)) {
                        rpad.gui2.startRichtextEdit(e);
                        e.preventDefault();
                    }
                }
            break;
            case e.KEY_ESCAPE: 
                if (rpad.gui2.activeRpadWidget && rpad.gui2.activeRpadWidget.editing) { 
                    rpad.gui2.activeRpadWidget.saveEdit();
                    rpad.gui2.activeRpadWidget.endEdit();
                    e.preventDefault();
                } else if (rpad.gui2.editing) {
                    rpad.gui2.richText.close();
                    e.preventDefault();
                }
            break;
            case e.KEY_DOWN_ARROW: 
                    if (rpad.gui2.activeRpadWidget && rpad.gui2.activeRpadWidget.editing || rpad.gui2.editing) { 
                        break;
                    }
                    rpad.gui2.goDown();
                    rpad.gui2._scroll(rpad.gui2.activeNode);
                    e.preventDefault();
            break;
            case e.KEY_UP_ARROW: 
                    if (rpad.gui2.activeRpadWidget && rpad.gui2.activeRpadWidget.editing || rpad.gui2.editing) { 
                        break;
                    }
                    rpad.gui2.goUp();
                    rpad.gui2._scroll(rpad.gui2.activeNode);
                    e.preventDefault();
            break;
            case e.KEY_LEFT_ARROW: 
                    if (rpad.gui2.activeRpadWidget && rpad.gui2.activeRpadWidget.editing || rpad.gui2.editing) { 
                        break;
                    }
                    rpad.gui2.goLeft();
                    rpad.gui2._scroll(rpad.gui2.activeNode);
                    e.preventDefault();
            break;
            case e.KEY_RIGHT_ARROW: 
                    if (rpad.gui2.activeRpadWidget && rpad.gui2.activeRpadWidget.editing || rpad.gui2.editing) { 
                        break;
                    }
                    rpad.gui2.goRight();
                    rpad.gui2._scroll(rpad.gui2.activeNode);
                    e.preventDefault();
            break;
 
            case e.KEY_BACKSPACE: // BACKSPACE key - disable for Mozilla/Mozile
                 if (!dojo.render.html.ie && e.originalTarget.nodeName != "INPUT" && 
                     e.originalTarget.nodeName != "TEXTAREA") { 
                   e.preventDefault();
                 }
            break;
            case e.KEY_F9: 
                 if (rpad.gui2.activeRpadWidget) { 
                     if (rpad.gui2.activeRpadWidget.editing) {
                         rpad.gui2.activeRpadWidget.saveEdit();
                     }
                     e.preventDefault();
                 }
//                      rpad.calculatePage();
                 break;
            case e.KEY_F8: 
                 if (rpad.gui2.activeRpadWidget) { 
                     if (rpad.gui2.activeRpadWidget.editing) {
                         rpad.gui2.activeRpadWidget.saveEdit();
                     }
                     rpad.gui2.activeRpadWidget.calculate();
                     e.preventDefault();
                 }
                 break;
            case e.KEY_F7: 
                 if (rpad.gui2.activeRpadWidget) { 
                     if (rpad.gui2.activeRpadWidget.editing) {
                         rpad.gui2.activeRpadWidget.saveEdit();
                         rpad.gui2.activeRpadWidget.endEdit();
                     }
                     rpad.gui2.activeRpadWidget.calculate();
                     rpad.gui2.activeRpadWidget.appendNew();
                     rpad.gui2.goDown();
                     rpad.gui2._scroll(rpad.gui2.activeNode);
                     rpad.gui2.activeRpadWidget.beginEdit();
                     e.preventDefault();
                 }
                 break;
            case e.KEY_F2: 
                 if (rpad.gui2.activeRpadWidget) { 
                     rpad.gui2.activeRpadWidget.toggleVisibility();
                     e.preventDefault();
                 }
                 break;
        }
    }
}


rpad.gui2.onmouseover = function(e) {
    if (!dojo.dom.isDescendantOf(e.target, rpad.gui2.activeNode) && 
        !dojo.dom.isDescendantOf(e.target, rpad.gui2.widgetBar.domNode) &&
        e.target.tagName != "BODY")
        dojo.html.addClass(e.target, "mouseoverNode");
}
rpad.gui2.onmouseout = function(e) {
    dojo.html.removeClass(e.target, "mouseoverNode");
}
rpad.gui2.onclick = function(e) {
    var node = rpad.utils.rpadParentNode(e.target);
    if(!node) node = e.target;
    if(!rpad.gui2.editing && 
       !(rpad.gui2.activeRpadWidget && rpad.gui2.activeRpadWidget.editing) &&
       !dojo.dom.isDescendantOf(e.target, rpad.gui2.widgetBar.domNode) &&
       !node.getAttribute("rpadIgnore") &&
       node.tagName != "BODY") {
        dojo.html.removeClass(e.target, "mouseoverNode");
        rpad.gui2.activateNode(node);
    }
}
rpad.gui2.ondblclick = function(e) { 
    var node = rpad.utils.rpadParentNode(e.target);
    if(!node) node = e.target;
    if(!rpad.gui2.editing && 
       !dojo.dom.isDescendantOf(e.target, rpad.gui2.widgetBar) &&
       !(rpad.gui2.activeRpadWidget && rpad.gui2.activeRpadWidget.editing)) {
        if(rpad.gui2.activeRpadWidget) {
           rpad.gui2.activeRpadWidget.beginEdit(e);
        } else if (dojo.render.html.ie || dojo.render.html.moz) {
           rpad.gui2.startRichtextEdit(e);
        }
    }
}

rpad.utils.rpadParentNode = function(node) {
    if (!node || node.nodeType != 1 || node.tagName == "BODY" || node.tagName == "HTML") return null;
    if (node.parentNode && node.parentNode.getAttribute("dojoAttachPoint") == "rpadWrapper") {
        return node.parentNode;
    } else {
        return rpad.utils.rpadParentNode(node.parentNode);
    }
}

rpad.gui2._scroll = function(node) {
// this could be better!
    var y = dojo.html.getAbsoluteY(node);
    window.scrollTo(0, dojo.html.getAbsoluteY(node) - dojo.html.getViewportHeight()/2);
}

rpad.gui2.activateNode = function(node) {
    rpad.gui2.deactivateNode(rpad.gui2.activeNode);
    rpad.gui2.activeNode = node;
    var widget = rpad.utils.getRpadWidget(node);
    if (widget) {
        rpad.gui2.activeRpadWidget = widget;
    } else {
        rpad.gui2.activeRpadWidget = null;
    }
    dojo.html.addClass(node, "activeNode");
    if (rpad.gui2.activeRpadWidget) rpad.gui2.widgetBar.attach(rpad.gui2.activeRpadWidget);
}
rpad.gui2.deactivateNode = function(node) {
    dojo.html.removeClass(node, "activeNode");
    rpad.gui2.widgetBar.hide();
}

rpad.utils.isInvisible = function(node) {
    if (node) {    
        return (dojo.html.getContentHeight(node) <= 1);
    } else {
        return null;
    }
}

rpad.gui2.nodeDown = function(node) {
    if (!node) return node;
    var newNode = node;
	do {
        newNode = dojo.dom.nextElement(newNode);
	} while(newNode && rpad.utils.isInvisible(newNode));
    if (!newNode && node.parentNode.nodeName != 'BODY') {
        newNode = rpad.gui2.nodeDown(node.parentNode);
    }
    if (newNode) {
        node = newNode;
    }
    return node;
}
rpad.gui2.nodeUp = function(node) {
    if (!node) return node;
    var newNode = node;
	do {
        newNode = dojo.dom.prevElement(newNode);
	} while(newNode && rpad.utils.isInvisible(newNode));
    if (!newNode && node.parentNode.nodeName != 'BODY') {
        newNode = rpad.gui2.nodeUp(node.parentNode);
    }
    if (newNode) {
        node = newNode;
    }
    return node;
}
rpad.gui2.nodeRight = function(node) {
    if (!node ) return node; 
    var newNode = dojo.dom.getFirstChildElement(node);
	while(rpad.utils.isInvisible(newNode)) {
        newNode = rpad.gui2.nodeDown(newNode);
	} 
    if (!newNode || rpad.utils.getRpadWidget(node)) { // don't go into an Rpad widget
        newNode = rpad.gui2.nodeDown(node);
    }
    if (newNode) {
        node = newNode;
    }
    return node;
}
rpad.gui2.nodeLeft = function(node) {
    if (node.parentNode.nodeName != 'BODY') {
        return node.parentNode;
    } else {
        return node;
    }
}

rpad.gui2.goDown = function() {
    rpad.gui2.activateNode(rpad.gui2.nodeDown(rpad.gui2.activeNode));
}
rpad.gui2.goUp = function() {
    rpad.gui2.activateNode(rpad.gui2.nodeUp(rpad.gui2.activeNode));
}
rpad.gui2.goRight = function() {
    rpad.gui2.activateNode(rpad.gui2.nodeRight(rpad.gui2.activeNode));
}
rpad.gui2.goLeft = function() {
    rpad.gui2.activateNode(rpad.gui2.nodeLeft(rpad.gui2.activeNode));
}

dojo.widget.defineWidget(
    "dojo.widget.RpadMenu",
    dojo.widget.HtmlWidget,
{
	widgetType: "RpadMenu",
	isContainer: true,
    templatePath: dojo.uri.dojoUri("rpaddivmenu.html"),
    attach: function(w) { // attach to a specific Rpad widget w
        this.bar.style.display = "";
        var label = w.rpadType;
        if (w.rpadInput.getAttribute("rpadType") == "file") label += ' - ' + w.rpadInput.getAttribute("filename");
//        this.popupButton.value = "zzzz";
        this.popupButton.value = label;
        var i = 0;
        for (var s in rpad.script.registered()) {
            if (s == w.rpadInput.getAttribute("rpadType")) {
                this.rpadTypeSelect.selectedIndex = i;
            }
            i++;
        }
        this.filenameWrapper.style.display = "none";
        if (w.rpadInput.getAttribute("rpadType") == "file") { // not universal
            this.filenameWrapper.style.display = "";
            this.filenameInput.value = w.rpadInput.getAttribute("filename");
        }
        var choices = ["normal","init","none"];
        for (var i in choices) {
            if (choices[i] == w.domNode.getAttribute("rpadRun")) {
                this.rpadRunSelect.selectedIndex = i;
            }
        }
        var choices = ["normal", "javascript", "none"];
        for (var i in choices) {
            if (choices[i] == w.rpadOutput) {
                this.rpadOutputSelect.selectedIndex = i;
            }
        }
        dojo.dom.insertAtPosition(this.domNode, w.domNode, "first");
//        dojo.dom.insertBefore(this.bar, w.domNode);
        this.bar.style.position = "relative";
        this.bar.style.height = "1px";
        this.bar.style.top = "1px";
//        this.bar.style.left = dojo.style.totalOffsetLeft(w.domNode) + 
//                              dojo.style.getInnerWidth(w.domNode) - 
//                              450 + "px";
        this.bar.style.left = dojo.html.totalOffsetLeft(w.domNode) + 
                              100 + "px";
        // set up the drag handle on the 
        var drag = new dojo.dnd.HtmlDragSource(rpad.gui2.activeRpadWidget.domNode);
        drag.setDragHandle(rpad.gui2.widgetBar.dragHandle);
    },
    initialize: function() {
        // fill in the rpadType select box
        for (var s in rpad.script.registered()) {
            var o = document.createElement("OPTION");
            var t = document.createTextNode(s);
            o.setAttribute("value",s);
            o.appendChild(t);
            this.rpadTypeSelect.appendChild(o);
        }
        dojo.event.connect(this.popupButton, "onmouseover", this, "showPopup");
        dojo.event.connect(this.popupButton, "onclick", this, "showPopup");
        dojo.event.connect(this.popupButton, "submit", this, "showPopup");
    },
    showPopup: function() {
        this.popup.style.display = "";
        this.popup.style.position = "absolute";
        this.popup.style.top = 
            dojo.html.totalOffsetTop(rpad.gui2.activeRpadWidget.domNode) + 20 + "px";
        this.popup.style.left = dojo.html.totalOffsetLeft(rpad.gui2.activeRpadWidget.domNode) + 
                                300 + "px";
    },
    hide: function() {
        this.bar.style.display = "none";
        this.popup.style.display = "none";
    }
});
dojo.widget.tags.addParseTreeHandler("dojo:RpadMenu");

function _sdump(evt) {
  var str = "DEBUG EVENT - start\n";
  for(var x in evt){
    str +=  x + ": " + evt[x] + "\n";
  }
  return str + "\nDEBUG EVENT - end\n\n";
} 
function _dump(evt) {
  dj_debug("DEBUG EVENT - start");
  for(var x in evt){
    dj_debug(x+": "+evt[x]);
  }
  dj_debug("DEBUG EVENT - end");
} 
function _dump2(evt) {
  for(var x in evt){
    dj_debug(evt[x].widgetType);
  }
} 

function props(e, onePerLine){
  if (e === null) {
    dojo.debug("props called with null argument", "error");
    return;
  }
  if (e === undefined) {
    dojo.debug("props called with undefined argument", "error");
    return;
  }
  var ns = ["Methods", "Fields", "Unreachables"];
  var as = [[], [], []]; // array of (empty) arrays of arrays!
  var p, j, i; // loop variables, several used multiple times
  var protoLevels = 0;
  for (p = e; p; p = p.__proto__)  {
    for (i=0; i<ns.length; ++i)
      as[i][protoLevels] = [];
    ++protoLevels;
  }
  for(var a in e)  {
    // Shortcoming: doesnt check that VALUES are the same in object and prototype.
    var protoLevel = -1;
    try    {
      for (p = e; p && (a in p); p = p.__proto__)
        ++protoLevel;
    }
    catch(er) { protoLevel = 0; } // "in" operator throws when param to props() is a string
    var type = 1;
    try    {
      if ((typeof e[a]) == "function")
        type = 0;
    }    catch (er) { type = 2; }
    as[type][protoLevel].push(a);
  }
  function times(s, n) { return n ? s + times(s, n-1) : ""; }
  for (j=0; j<protoLevels; ++j)
    for (i=0;i<ns.length;++i)
      if (as[i][j].length)
        dojo.debug(
          ns[i] + times(" of prototype", j), 
          (onePerLine ? "\n\n" : "") + as[i][j].sort().join(onePerLine ? "\n" : ", ") + (onePerLine ? "\n\n" : ""), 
          "propList");
}

R = function(R_commands){
// Send "R_commands" for processing. Return results as a string
    djConfig.isDebug = true;
    rpad.script.run("R", R_commands, null, document, "djConfig.isDebug = false");
}
   
