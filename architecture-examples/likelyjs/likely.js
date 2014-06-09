!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.likely=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

"use strict";
var util = _dereq_('./util');

var EXPRESSION_REG = /^{{(.+?)}}/;

// Expression evaluation engine
function StringValue(txt) {
  this.type = "value";
  if(txt[0] == '"') {
    this.value = txt.replace(/^"|"$/g, "");
  } else if(txt[0] == "'") {
    this.value = txt.replace(/^'|'$/g, "");
  } else {
    throw new util.CompileError("Invalid string value " + txt);
  }
}
StringValue.prototype.evaluate = function(context) {
  return this.value;
};
StringValue.reg = /^"(?:\\"|[^"])*"|^'(?:\\'|[^'])*'/;

function EqualOperator(txt) {
  this.type = "operator";
  this.left = null;
  this.right = null;
}
EqualOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) == this.right.evaluate(context);
};
EqualOperator.reg = /^==/;

function NotEqualOperator(txt) {
  this.type = "operator";
  this.left = null;
  this.right = null;
}
NotEqualOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) != this.right.evaluate(context);
};
NotEqualOperator.reg = /^!=/;

function BiggerOperator(txt) {
  this.type = "operator";
  this.left = null;
  this.right = null;
}
BiggerOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) > this.right.evaluate(context);
};
BiggerOperator.reg = /^>/;

function SmallerOperator(txt) {
  this.type = "operator";
  this.left = null;
  this.right = null;
}
SmallerOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) < this.right.evaluate(context);
};
SmallerOperator.reg = /^</;

function OrOperator(txt) {
  this.type = "operator";
  this.left = null;
  this.right = null;
}
OrOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) || this.right.evaluate(context);
};
OrOperator.reg = /^or/;

function AndOperator(txt) {
  this.type = "operator";
  this.left = null;
  this.right = null;
}
AndOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) && this.right.evaluate(context);
};
AndOperator.reg = /^and/;

function Name(txt) {
  this.type = "value";
  this.name = txt;
}
Name.prototype.evaluate = function(context) {
  var value = context.get(this.name);
  return value;
};
Name.reg = /^[A-Za-z][\w\.]{0,}/;

function Filter(txt) {
  this.type = 'operator';
  this.left = null;
  this.right = null;
}
Filter.prototype.evaluate = function(context) {
  var fct = context.get(this.right.name);
  return fct.apply(this, [this.left.evaluate(context), context]);
};
Filter.reg = /^\|/;

// math

function MultiplyOperator(txt) {
  this.type = 'operator';
  this.left = null;
  this.right = null;
}
MultiplyOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) * this.right.evaluate(context);
};
MultiplyOperator.reg = /^\*/;

function PlusOperator(txt) {
  this.type = 'operator';
  this.left = null;
  this.right = null;
}
PlusOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) + this.right.evaluate(context);
};
PlusOperator.reg = /^\+/;

function MinusOperator(txt) {
  this.type = 'operator';
  this.left = null;
  this.right = null;
}
MinusOperator.prototype.evaluate = function(context) {
  return this.left.evaluate(context) - this.right.evaluate(context);
};
MinusOperator.reg = /^\-/;

function FunctionCall(txt) {
  this.type = 'value';
  var m = txt.match(/^([a-zA-Z][a-zA-Z0-9\.]*)\(([^\)]*)\)/), i;
  this.funcName = m[1];
  // TODO: this a weak way to parse things
  this.params = [];
  var params = m[2].split(',');
  for(i=0; i<params.length; i++) {
    if(params[i]) {
      this.params.push(build(params[i]));
    }
  }
}
FunctionCall.prototype.evaluate = function(context) {
  var func = context.get(this.funcName), i, params=[];
  for(i=0; i<this.params.length; i++) {
    params.push(this.params[i].evaluate(context));
  }
  return func.apply(context, params);
};
FunctionCall.reg = /^[a-zA-Z][a-zA-Z0-9\.]*\([^\)]*\)/;

function NumberValue(txt) {
  this.type = 'value';
  this.number = parseFloat(txt, 10);
  this.evaluate = function(context) {
    return this.number;
  };
}
NumberValue.reg = /^[0-9]+/;

function IfOperator(txt) {
  this.type = 'operator';
  this.left = null;
  this.right = null;
}
IfOperator.prototype.evaluate = function(context) {
  var rv = this.right.evaluate(context);
  if(rv) {
    return this.left.evaluate(context);
  }
  return rv;
};
IfOperator.reg = /^if /;

function InOperator(txt) {
  this.type = 'operator';
  this.left = null;
  this.right = null;
}
InOperator.prototype.evaluate = function(context) {
  var left = this.left.evaluate(context);
  var right = this.right.evaluate(context);
  if(right === undefined) {
    throw new util.RuntimeError('right side of in operator cannot be undefined');
  }
  if(right.indexOf) {
    return right.indexOf(left) != -1;
  } else {
    return right.hasOwnProperty(left);
  }
};
InOperator.reg = /^in /;

function NotOperator(txt) {
  this.type = 'unary';
  this.right = null;
}
NotOperator.prototype.evaluate = function(context) {
  return !this.right.evaluate(context);
};
NotOperator.reg = /^not /;

function compileTextAndExpressions(txt) {
  // compile the expressions found in the text
  // and return a list of text+expression
  var expr, around;
  var list = [];
  while(true) {
    var match = /{{(.+?)}}/.exec(txt);
    if(!match) {
      if(txt) {
        list.push(txt);
      }
      break;
    }
    expr = build(match[1]);
    around = txt.split(match[0], 2);
    if(around[0].length) {
      list.push(around[0]);
    }
    list.push(expr);
    txt = around[1];
  }
  return list;
}

function evaluateExpressionList(expressions, context) {
  var str = "", i;
  for(i=0; i<expressions.length; i++) {
    var param = expressions[i];
    if(param.evaluate) {
      str += param.evaluate(context);
    } else {
      str += param;
    }
  }
  return str;
}

// list order define operator precedence
var expression_list = [
  MultiplyOperator,
  PlusOperator,
  MinusOperator,
  BiggerOperator,
  SmallerOperator,
  EqualOperator,
  NotEqualOperator,
  Filter,
  InOperator,
  NotOperator,
  IfOperator,
  OrOperator,
  AndOperator,
  StringValue,
  NumberValue,
  FunctionCall,
  Name,
];

function build(input) {
  return buildExpressions(parseExpressions(input));
}

function parseExpressions(input) {
  // Return a list of expressions
  var currentExpr = null, i, expr, match, found, parsed = [];
  while(input) {
    input = util.trim(input);
    found = false;
    for(i=0; i<expression_list.length; i++) {
        expr = expression_list[i];
        match = expr.reg.exec(input);
        if(match) {
          input = input.slice(match[0].length);
          parsed.push(new expr(match[0], currentExpr));
          found = true;
          // starting again to respect precedence
          i = 0;
        }
    }
    if(found === false) {
      throw new util.CompileError("Expression parser: Impossible to parse further : " + input);
    }
  }
  return parsed;
}

function buildExpressions(list) {
  // build a tree of expression respecting precedence
  var i, j, expr;
  // a dumb algo that works
  for(i=0; i<expression_list.length; i++) {
    for(j=0; j<list.length; j++) {
      if(list.length == 1) {
        return list[0];
      }
      expr = list[j];
      if(expr instanceof expression_list[i]) {
        if(expr.type == 'operator') {
          expr.left = list[j-1];
          expr.right = list[j+1];
          list.splice(j-1, 2);
          list[j-1] = expr;
          j = j - 1;
        }
        if(expr.type == 'unary') {
          expr.right = list[j+1];
          list.splice(j+1, 1);
        }
        if(expr.type == 'value') {
          throw new util.CompileError("Expression builder: expected an operator but got " + expr.constructor.name);
        }
      }
    }
  }
}

module.exports = {
  build:build,
  compileTextAndExpressions:compileTextAndExpressions,
  buildExpressions:buildExpressions,
  parseExpressions:parseExpressions,
  evaluateExpressionList:evaluateExpressionList,
  StringValue:StringValue,
  Name:Name,
  EXPRESSION_REG:EXPRESSION_REG
};
},{"./util":5}],2:[function(_dereq_,module,exports){
/* Likely.js,
   Python style HTML template language with bi-directionnal data binding
   batiste bieler 2014 */
"use strict";

var util = _dereq_('./util');
var render = _dereq_('./render');
var expression = _dereq_('./expression');
var template = _dereq_('./template');

function updateData(context, dom) {
  var name = dom.getAttribute("lk-bind"), value;
  if(!name) {
    throw "No lk-bind attribute on the element";
  }
  if(dom.type == 'checkbox' && !dom.checked) {
    value = "";
  } else {
    value = dom.value;// || dom.getAttribute("value");
  }
  // update the context
  context.modify(name, value);
}

function Binding(dom, tpl, data) {
  if (this.constructor !== Binding) {
    return new Binding(dom, tpl, data);
  }
  // double data binding between some data and some dom
  this.dom = dom;
  this.data = data;
  this.context = new template.Context(this.data);
  this.template = tpl;
}

Binding.prototype.tree = function() {
  return this.template.tree(new template.Context(this.data));
};

Binding.prototype.init = function() {
  this.dom.innerHTML = "";
  this.currentTree = this.tree();
  this.currentTree.domTree(this.dom);
  this.bindEvents();
};

Binding.prototype.domInit = function() {
  // create an initial tree from the DOM
  this.currentTree = render.initialRenderFromDom(this.dom);
  this.currentTree.nodeName = undefined;
  this.bindEvents();
};

Binding.prototype.diff = function() {
  var newTree = this.tree();
  var diff = this.currentTree.diff(newTree);
  render.applyDiff(diff, this.dom);
  this.currentTree = newTree;
  this.lock = false;
};

Binding.prototype.dataEvent = function(e) {
  var dom = e.target;
  var name = dom.getAttribute('lk-bind');
  if(name) {
    var renderNode = this.getRenderNodeFromPath(dom);
    updateData(renderNode.context, dom);
    if(!this.lock) {
      this.lock = true;
      this.diff();
    }
    this.dom.dispatchEvent(
      util.event('dataViewChanged'),
      {"name": name}
    );
  }
};

Binding.prototype.getRenderNodeFromPath = function(dom) {
  var path = dom.getAttribute('lk-path');
  var renderNode = this.currentTree;
  var bits = path.split("."), i;
  for(i=1; i<bits.length; i++) {
    renderNode = renderNode.children[bits[i]];
  }
  return renderNode;
};

Binding.prototype.anyEvent = function(e) {
  var dom = e.target;
  var lkEvent = dom.getAttribute('lk-' + e.type);
  if(!lkEvent) {
    return;
  }
  var renderNode = this.getRenderNodeFromPath(dom);
  var ctx = template.Context({event: e}, renderNode.context);
  renderNode.node.attrs['lk-'+e.type].evaluate(ctx);
};

Binding.prototype.bindEvents = function() {
  var i;
  this.dom.addEventListener("keyup", function(e){ this.dataEvent(e); }.bind(this), false);
  this.dom.addEventListener("change", function(e){ this.dataEvent(e); }.bind(this), false);
  var events = "click,dbclick,change,mouseover,focus,keydown,keyup,keypress,submit,blur".split(',');
  for(i=0; i<events.length; i++) {
    this.dom.addEventListener(
      events[i],
      function(e){ this.anyEvent(e); }.bind(this), false);
  }
};

Binding.prototype.update = function(){
  this.diff();
};

//TODO: automatic new on Context, Template and Component
function Component(name, tpl, controller) {
  if (this.constructor !== Component) {
    return new Component(name, tpl, controller);
  }
  if(template.componentCache[name]) {
    util.CompileError("Component with name " + name + " already exist");
  }
  this.name = name;
  this.template = tpl;
  this.controller = controller;
  template.componentCache[name] = this;
}

module.exports = {
  Template:template.buildTemplate,
  ContextName:template.ContextName,
  updateData:updateData,
  Binding:Binding,
  Component:Component,
  getDom:render.getDom,
  componentCache:template.componentCache,
  parseExpressions:expression.parseExpressions,
  compileTextAndExpressions:expression.compileTextAndExpressions,
  buildExpressions:expression.buildExpressions,
  expressions:{
    StringValue:expression.StringValue
  },
  applyDiff:render.applyDiff,
  diffCost:render.diffCost,
  parseAttributes:template.parseAttributes,
  attributesDiff:render.attributesDiff,
  Context:template.Context,
  CompileError:util.CompileError,
  RuntimeError:util.RuntimeError,
  escape:util.escape,
  initialRenderFromDom:render.initialRenderFromDom,
  expression:expression,
  render:render,
  util:util,
  setHandicap:function(n){render.handicap = n;}
};

},{"./expression":1,"./render":3,"./template":4,"./util":5}],3:[function(_dereq_,module,exports){

"use strict";

function RenderedNode(node, context, renderer, path) {
  this.children = [];
  this.node = node;
  this.context = context;
  this.renderer = renderer;
  this.path = path || "";
  // shortcut
  this.nodeName = node.nodeName;
}

RenderedNode.prototype.repr = function(level) {
  var str = "", i;
  if(level === undefined) {
    level = 0;
  }
  for(i=0; i<level; i++) {
    str += "  ";
  }
  str += String(this.node) + " path " + this.path + "\r\n";
  for(i=0; i<this.children.length; i++) {
    str += this.children[i].repr(level + 1);
  }
  return str;
};

RenderedNode.prototype.domTree = function(append_to) {
  var node = append_to || this.node.domNode(this.context, this.path), i, child_tree;
  for(i=0; i<this.children.length; i++) {
    child_tree = this.children[i].domTree();
    if(node.push) {
      node.push(child_tree);
    } else {
      node.appendChild(child_tree);
    }
  }
  return node;
};

RenderedNode.prototype.domHtml = function() {
  var i;
  //var d = document.createDocumentFragment();
  var d = document.createElement('div');
  for(i=0; i<this.children.length; i++) {
    var child = this.children[i].domTree();
    d.appendChild(child);
  }
  return d.innerHTML;
};

function diffCost(diff) {
  var value=0, i;
  for(i=0; i<diff.length; i++) {
    if(diff[i].action == "remove") {
      value += 5;
    }
    if(diff[i].action == "add") {
      value += 2;
    }
    if(diff[i].action == "mutate") {
      value += 1;
    }
    if(diff[i].action == "stringmutate") {
      value += 1;
    }
  }
  return value;
}

RenderedNode.prototype._diff = function(rendered_node, accu, path) {
  var i, j, source_pt = 0;
  if(path === undefined) { path = ""; }

  if(!rendered_node) {
    accu.push({
      action: 'remove',
      node: this,
      path: path
    });
    return accu;
  }

  if(rendered_node.nodeName != this.nodeName) {
    accu.push({
      action: 'remove',
      node: this,
      path: path
    });
    accu.push({
      action: 'add',
      node: rendered_node,
      path: path
    });
    return accu;
  }

  // Could use inheritance for this
  if(this.nodeName == "#text" && this.renderer != rendered_node.renderer) {
      accu.push({
        action: 'stringmutate',
        node: this,
        value: rendered_node.renderer,
        path: path
      });
    return accu;
  } else {
    var a_diff = attributesDiff(this.attrs, rendered_node.attrs);
    if(a_diff.length) {
      accu.push({
        action: 'mutate',
        node: this,
        attributesDiff: a_diff,
        path: path
      });
    }
  }

  var l1 = this.children.length;
  var l2 = rendered_node.children.length;

  // no swap possible, but deleting a node is possible
  j = 0; i = 0; source_pt = 0;
  // let's got trough all the children
  for(; i<l1; i++) {
    var diff = 0, after_source_diff = 0, after_target_diff = 0, after_source_cost=null, after_target_cost=null;
    var after_target = rendered_node.children[j+1];
    var after_source = this.children[i+1];

    if(!rendered_node.children[j]) {
      accu.push({
        action: 'remove',
        node: this.children[i],
        path: path + '.' + source_pt
      });
      continue;
    }

    diff = this.children[i]._diff(rendered_node.children[j], [], path + '.' + source_pt);

    var cost = diffCost(diff);
    // does the next source one fits better?
    if(after_source) {
      after_source_diff = after_source._diff(rendered_node.children[j], [], path + '.' + source_pt);
      // needs some handicap otherwise inputs containing the current focus
      // might be removed
      after_source_cost = diffCost(after_source_diff) + module.exports.handicap;
    }
    // does the next target one fits better?
    if(after_target) {
      after_target_diff = this.children[i]._diff(after_target, [], path + '.' + source_pt);
      after_target_cost = diffCost(after_target_diff) + module.exports.handicap;
    }

    if((!after_target || cost <= after_target_cost) && (!after_source || cost <= after_source_cost)) {
      accu = accu.concat(diff);
      source_pt += 1;
    } else if(after_source && (!after_target || after_source_cost <= after_target_cost)) {
      accu.push({
        type: 'after_source',
        action: 'remove',
        node: this.children[i],
        path: path + '.' + source_pt
      });
      accu = accu.concat(after_source_diff);
      source_pt += 1;
      i++;
    } else if(after_target) {
      // important to add the diff before
      accu = accu.concat(after_target_diff);
      accu.push({
        type: 'after_target',
        action: 'add',
        node: rendered_node.children[j],
        path: path + '.' + (source_pt)
      });
      source_pt += 2;
      j++;
    } else {
      throw "Should never happen";
    }
    j++;
  }

  // new nodes to be added after the diff
  for(i=0; i<(l2-j); i++) {
    accu.push({
      action: 'add',
      node: rendered_node.children[j+i],
      path: path + '.' + (source_pt + 1)
    });
    source_pt += 1;
  }

  return accu;

};

RenderedNode.prototype.diff = function(rendered_node) {
  var accu = [];
  return this._diff(rendered_node, accu);
};

function attributesDiff(a, b) {
  var changes = [], key;
  for(key in a) {
      if(b[key] === false) {
        changes.push({action:"remove", key:key});
      } else if(b[key] !== undefined) {
        if(b[key] != a[key]) {
          changes.push({action:"mutate", key:key, value:b[key]});
        }
      } else {
        changes.push({action:"remove", key:key});
      }
  }
  for(key in b) {
    if(a[key] === undefined) {
      changes.push({action:"add", key:key, value:b[key]});
    }
  }
  return changes;
}

function getDom(dom, path, stop) {
  var i, p=path.split('.'), d=dom;
  if(stop === undefined) {
    stop = 0;
  }
  for(i=0; i<(p.length - stop); i++) {
    if(p[i]) { // first one is ""
      d = d.childNodes[parseInt(p[i], 10)];
    }
  }
  return d;
}

function applyDiff(diff, dom) {
  var i, j, _diff, _dom, parent;
  for(i=0; i<diff.length; i++) {
    _diff = diff[i];
    _dom = getDom(dom, _diff.path);
    if(_diff.action == "remove") {
      _dom.parentNode.removeChild(_dom);
    }
    if(_diff.action == "add") {
      var newNode = _diff.node.domTree();
      if(_dom) {
        _dom.parentNode.insertBefore(newNode, _dom);
      } else {
        // get the parent
        parent = getDom(dom, _diff.path, 1);
        parent.appendChild(newNode);
      }
    }
    if(_diff.action == "mutate") {
      for(j=0; j<_diff.attributesDiff.length; j++) {
        var a_diff = _diff.attributesDiff[j];
        if(a_diff.action == "mutate") {
          // important for select
          if("value,selected,checked".indexOf(a_diff.key) != -1) {
            if(_dom[a_diff.key] != a_diff.value) {
              _dom[a_diff.key] = a_diff.value;
            }
          }
          _dom.setAttribute(a_diff.key, a_diff.value);
        }
        if(a_diff.action == "remove") {
          if("checked,selected".indexOf(a_diff.key) != -1) {
            _dom[a_diff.key] = false;
          }
          _dom.removeAttribute(a_diff.key);
        }
        if(a_diff.action == "add") {
          if("checked,selected".indexOf(a_diff.key) != -1) {
            _dom[a_diff.key] = a_diff.value;
          }
          _dom.setAttribute(a_diff.key, a_diff.value);
        }
      }
    }
    if(_diff.action == "stringmutate") {
      _dom.nodeValue = _diff.value;
    }
  }
}

function initialRenderFromDom(dom, path) {
  path = path || "";
  var i, child, children = [], attrs = {}, renderer = '';
  if(dom.attributes) {
    for(i=0; i < dom.attributes.length; i++) {
      var attr = dom.attributes[i];
      attrs[attr.name] = attr.value;
    }
  }
  if(dom.childNodes) {
    for(i=0; i < dom.childNodes.length; i++) {
      child = dom.childNodes[i];
      children.push(initialRenderFromDom(child, path + '.' + i));
    }
  }
  if(dom.textContent) {
    renderer = dom.textContent;
  }
  var rn = new RenderedNode(
    {nodeName: dom.nodeName.toLowerCase(), node:dom},
    undefined,
    renderer,
    path);
  rn.attrs = attrs;
  rn.children = children;
  return rn;
}

module.exports = {
  RenderedNode:RenderedNode,
  initialRenderFromDom:initialRenderFromDom,
  applyDiff:applyDiff,
  attributesDiff:attributesDiff,
  diffCost:diffCost,
  getDom:getDom,
  handicap:1
};
},{}],4:[function(_dereq_,module,exports){

"use strict";
var util = _dereq_('./util');
var render = _dereq_('./render');
var expression = _dereq_('./expression');

var templateCache = {};
var componentCache = {};
// a name here is also any valid JS object property
var VARNAME_REG = /^[a-zA-Z_$][0-9a-zA-Z_$]*/;
var HTML_ATTR_REG = /^[A-Za-z][\w-]{0,}/;
var DOUBLE_QUOTED_STRING_REG = /^"(\\"|[^"])*"/;

function ContextName(name) {
  this.bits = name.split('.');
}

ContextName.prototype.substituteAlias = function(context) {
  if(context.aliases.hasOwnProperty(this.bits[0])) {
    var newBits = context.aliases[this.bits[0]].split('.');
    this.bits.shift();
    this.bits = newBits.concat(this.bits);
  }
};

ContextName.prototype.start = function() {
  return this.bits[0];
};

ContextName.prototype.str = function() {
  return this.bits.join('.');
};

function Context(data, parent) {
  if (this.constructor !== Context) {
    return new Context(data, parent);
  }
  this.data = data;
  this.parent = parent;
  this.aliases = {};
  this.watching = {};
}

Context.prototype.addAlias = function(sourceName, aliasName) {
  // source name can be 'name' or 'list.key'
  if(sourceName === aliasName) {
    throw new util.CompileError("Alias with the name " + aliasName + " already present in this context.");
  }
  this.aliases[aliasName] = sourceName;
};

Context.prototype.resolveName = function(name) {
  // given a name, return the [Context, resolved path, value] when
  // this name is found or undefined otherwise
  name.substituteAlias(this);

  if(this.data.hasOwnProperty(name.start())) {
    var value = this.data[name.start()];
    var i = 1;
    while(i < name.bits.length) {
      if(!value.hasOwnProperty(name.bits[i])) {
        return undefined;
      }
      value = value[name.bits[i]];
      i++;
    }
    return [this, name.str(), value];
  }

  if(this.parent) {
    return this.parent.resolveName(name);
  }

};

Context.prototype.getNamePath = function(name) {
  var resolved = this.resolveName(new ContextName(name));
  if(resolved) {
    return resolved[1];
  }
};

Context.prototype.watch = function(name, callback) {
  this.watching[name] = callback;
};

Context.prototype.get = function(name) {
  var resolved = this.resolveName(new ContextName(name));
  if(resolved) {
    return resolved[2];
  }
};

Context.prototype.modify = function(name, value) {
  this._modify(new ContextName(name), value);
};

Context.prototype._modify = function(name, value) {

  if(this.watching.hasOwnProperty(name.str())) {
    this.watching[name.str()](value);
  }

  name.substituteAlias(this);

  // we go in for a search if the first part matches
  if(this.data.hasOwnProperty(name.start())) {
    var data = this.data;
    var i = 0;
    while(i < name.bits.length - 1) {
      if(!data.hasOwnProperty(name.bits[i])) {
        return undefined;
      }
      data = data[name.bits[i]];
      i++;
    }
    data[name.bits[i]] = value;
    return true;
  }
  // data not found, let's search in the parent
  if(this.parent) {
    return this.parent._modify(name, value);
  }

};

Context.prototype.set = function(name, value) {
  this.data[name] = value;
};

function parseAttributes(v, node) {
  var attrs = {}, n, s;
  while(v) {
      v = util.trim(v);
      n = v.match(HTML_ATTR_REG);
      if(!n) {
        node.cerror("parseAttributes: No attribute name found in "+v);
      }
      v = v.substr(n[0].length);
      n = n[0];
      if(v[0] != "=") {
        node.cerror("parseAttributes: No equal sign after name "+n);
      }
      v = v.substr(1);
      s = v.match(DOUBLE_QUOTED_STRING_REG);
      if(s) {
        attrs[n] = new StringNode(null, s[0]);
      } else {
        s = v.match(expression.EXPRESSION_REG);
        if(s === null) {
          node.cerror("parseAttributes: No string or expression found after name "+n);
        } else {
          var expr = expression.build(s[1]);
          attrs[n] = expr;
        }
      }
      v = v.substr(s[0].length);
  }
  return attrs;
}

// all the available template node

function Node(parent, content, level, line) {
  this.line = line;
  this.parent = parent;
  this.content = content;
  this.level = level;
  this.children = [];
}

Node.prototype.repr = function(level) {
  var str = "", i;
  if(level === undefined) {
    level = 0;
  }
  for(i=0; i<level; i++) {
    str += "  ";
  }
  str += String(this) + "\r\n";
  for(i=0; i<this.children.length; i++) {
    str += this.children[i].repr(level + 1);
  }
  return str;
};

Node.prototype.tree = function(context, path, pos) {
  if(path === undefined) {
    path = '';
    pos = 0;
    this.isRoot = true;
  }
  var t = new render.RenderedNode(this, context, '', path);
  t.children = this.treeChildren(context, path, pos);
  return t;
};

Node.prototype.cerror = function(msg) {
  throw new util.CompileError(this.toString() + ": " + msg);
};

Node.prototype.domNode = function() {
  return [];
};

Node.prototype.treeChildren = function(context, path, pos) {
  var t = [], i, p, j, children = null, child = null;
  j = pos;
  for(i=0; i<this.children.length; i++) {
    p = path;
    child = this.children[i];
    if(child.hasOwnProperty('nodeName')) {
      p += '.' + j;
      j++;
      children = child.tree(context, p, 0);
      t.push(children);
    } else if (!child.renderExlcuded) {
      children = child.tree(context, p, j);
      if(children) {
        t = t.concat(children);
        j += children.length;
      }
    }
  }
  return t;
};

Node.prototype.addChild = function(child) {
  this.children.push(child);
};

Node.prototype.toString = function() {
  return this.constructor.name + "("+this.content.replace("\n", "")+") at line " + this.line;
};

function CommentNode(parent, content, level, line) {
  Node.call(this, parent, content, level, line);
  parent.children.push(this);
  this.renderExlcuded = true;
}
util.inherits(CommentNode, Node);

function HtmlNode(parent, content, level, line) {
  Node.call(this, parent, content, level, line);
  this.nodeName = this.content.split(" ")[0];
  this.attrs = parseAttributes(this.content.substr(this.nodeName.length), this);
  parent.addChild(this);
}
util.inherits(HtmlNode, Node);

HtmlNode.prototype.tree = function(context, path, pos) {
  var t = new render.RenderedNode(this, context, this.domNode(context, path), path);
  t.attrs = this.renderAttributes(context, path);
  t.children = this.treeChildren(context, path, pos);
  return t;
};

function bindingName(node) {
  if(node instanceof expression.Name) {
    return node.name;
  }
  if(node instanceof StringNode && node.compiledExpression.length == 1 &&
      node.compiledExpression[0] instanceof expression.Name) {
    return node.compiledExpression[0].name;
  }
}

HtmlNode.prototype.renderAttributes = function(context, path) {
  var r_attrs = {}, key, attr, name;
  for(key in this.attrs) {
    attr = this.attrs[key];
    // todo, find a better way to discriminate events
    if(key.indexOf("lk-") === 0) {
      // add the path to the render node to any lk-thing node
      r_attrs['lk-path'] = path;
      if(key === 'lk-bind') {
        r_attrs[key] = attr.evaluate(context);
      } else {
        r_attrs[key] = "true";
      }
      continue;
    }
    if(attr.evaluate) {
      var v = attr.evaluate(context);
      if(v === false) {
        // nothing
      } else {
        r_attrs[key] = v;
      }
    } else {
      r_attrs[key] = attr;
    }
  }
  if("input,select,textarea".indexOf(this.nodeName) != -1 && this.attrs.hasOwnProperty('value')) {
    attr = this.attrs.value;
    name = bindingName(attr);
    if(name && this.attrs['lk-bind'] === undefined) {
      r_attrs['lk-bind'] = name;
      r_attrs['lk-path'] = path;
    }
  }
  if(this.nodeName == "textarea" && this.children.length == 1) {
    name = bindingName(this.children[0].expression);
    if(name && this.attrs['lk-bind'] === undefined) {
      r_attrs['lk-bind'] = name;
      r_attrs['lk-path'] = path;
      // as soon as the user has altered the value of the textarea or script has altered
      // the value property of the textarea, the text node is out of the picture and is no
      // longer bound to the textarea's value in any way.
      r_attrs.value = this.children[0].expression.evaluate(context);
    }
  }
  return r_attrs;
};

HtmlNode.prototype.domNode = function(context, path) {
  var node = document.createElement(this.nodeName), key, attrs=this.renderAttributes(context, path);
  for(key in attrs) {
    node.setAttribute(key, attrs[key]);
  }
  return node;
};

function ForNode(parent, content, level, line) {
  // syntax: for key, value in list
  //         for value in list
  Node.call(this, parent, content, level, line);
  var var1, var2, sourceName;
  content = util.trim(content.substr(4));
  var1 = content.match(VARNAME_REG);
  if(!var1) {
    this.cerror("first variable name is missing");
  }
  content = util.trim(content.substr(var1[0].length));
  if(content[0] == ',') {
    content = util.trim(content.substr(1));
    var2 = content.match(VARNAME_REG);
    if(!var2) {
      this.cerror("second variable after comma is missing");
    }
    content = util.trim(content.substr(var2[0].length));
  }
  if(!content.match(/^in/)) {
    this.cerror("in keyword is missing");
  }
  content = util.trim(content.substr(2));
  sourceName = content.match(expression.Name.reg);
  if(!sourceName) {
    this.cerror("iterable name is missing");
  }
  this.sourceName = sourceName[0];
  content = util.trim(content.substr(sourceName[0].length));
  if(content !== "") {
    this.cerror("left over unparsable content: " + content);
  }

  if(var1 && var2) {
    this.indexName = var1;
    this.alias = var2[0];
  } else {
    this.alias = var1[0];
  }
  parent.addChild(this);
}
util.inherits(ForNode, Node);

ForNode.prototype.tree = function(context, path, pos) {
  var t = [], key;
  var d = context.get(this.sourceName);
  for(key in d) {
    var new_data = {};
    // add the key to access the context's data
    if(this.indexName) {
      new_data[this.indexName] = key;
    }
    var new_context = new Context(new_data, context);
    // keep track of where the data is coming from
    new_context.addAlias(this.sourceName + '.' + key, this.alias);
    t = t.concat(this.treeChildren(new_context, path, t.length + pos));
  }
  return t;
};

function IfNode(parent, content, level, line) {
  Node.call(this, parent, content, level, line);
  this.expression = expression.build(content.replace(/^if/g, ""));
  parent.children.push(this);
}
util.inherits(IfNode, Node);

IfNode.prototype.tree = function(context, path, pos) {
  if(!this.expression.evaluate(context)) {
    if(this.else) {
      return this.else.tree(context, path, pos);
    }
    return;
  }
  return this.treeChildren(context, path, pos);
};

function ElseNode(parent, content, level, line, currentNode) {
  Node.call(this, parent, content, level, line);
  this.searchIf(currentNode);
}
util.inherits(ElseNode, Node);

ElseNode.prototype.tree = function(context, path, pos) {
  return this.treeChildren(context, path, pos);
};

function IfElseNode(parent, content, level, line, currentNode) {
  Node.call(this, parent, content, level, line);
  this.expression = expression.build(content.replace(/^elseif/g, ""));
  this.searchIf(currentNode);
}
// important to be an IfNode
util.inherits(IfElseNode, IfNode);

IfElseNode.prototype.searchIf = function searchIf(currentNode) {
  // first node on the same level has to be the if/elseif node
  while(currentNode) {
    if(currentNode.level < this.level) {
      this.cerror("cannot find a corresponding if-like statement at the same level.");
    }
    if(currentNode.level == this.level) {
      if(!(currentNode instanceof IfNode)) {
        this.cerror("at the same level is not a if-like statement.");
      }
      currentNode.else = this;
      break;
    }
    currentNode = currentNode.parent;
  }
};
ElseNode.prototype.searchIf = IfElseNode.prototype.searchIf;

function ExpressionNode(parent, content, level, line) {
  Node.call(this, parent, content, level, line);
  this.nodeName = "#text";
  var m = content.match(expression.EXPRESSION_REG);
  if(!m) {
    this.cerror("declared improperly");
  }
  this.expression = expression.build(m[1]);
  parent.addChild(this);
}
util.inherits(ExpressionNode, Node);

ExpressionNode.prototype.tree = function(context, path) {
  // renderer
  var renderer = String(this.expression.evaluate(context));
  var t = new render.RenderedNode(this, context, renderer, path);
  return t;
};

ExpressionNode.prototype.domNode = function(context) {
  return document.createTextNode(this.expression.evaluate(context));
};

function StringNode(parent, content, level, line) {
  Node.call(this, parent, content, level, line);
  this.nodeName = "#text";
  this.string = this.content.replace(/^"|"$/g, "").replace(/\\"/g, '"', 'gm');
  this.compiledExpression = expression.compileTextAndExpressions(this.string);
  if(parent) {
    parent.addChild(this);
  }
}
util.inherits(StringNode, Node);

StringNode.prototype.tree = function(context, path) {
  // renderer should be all attributes
  var renderer = expression.evaluateExpressionList(this.compiledExpression, context);
  var t = new render.RenderedNode(this, context, renderer, path);
  return t;
};

StringNode.prototype.evaluate = function(context) {
  return expression.evaluateExpressionList(this.compiledExpression, context);
};

StringNode.prototype.domNode = function(context) {
  return document.createTextNode(expression.evaluateExpressionList(this.compiledExpression, context));
};

StringNode.prototype.addChild = function(child) {
  this.cerror("cannot have children " + child);
};

function IncludeNode(parent, content, level, line) {
  Node.call(this, parent, content, level, line);
  this.name = util.trim(content.split(" ")[1]);
  this.template = templateCache[this.name];
  if(this.template === undefined) {
    this.cerror("Template with name " + this.name + " is not registered");
  }
  parent.addChild(this);
}
util.inherits(IncludeNode, Node);

IncludeNode.prototype.tree = function(context, path, pos) {
  return this.template.treeChildren(context, path, pos);
};

function ComponentNode(parent, content, level, line) {
  Node.call(this, parent, content, level, line);
  content = util.trim(content).substr(10);
  var name = content.match(VARNAME_REG);
  if(!name) {
    this.cerror("Component name is missing");
  }
  content = util.trim(content.substr(name[0].length));
  this.name = name[0];
  this.attrs = parseAttributes(content, this);
  this.component = componentCache[this.name];
  if(this.component === undefined) {
    this.cerror("Component with name " + this.name + " is not registered");
  }
  parent.addChild(this);
}
util.inherits(ComponentNode, Node);

ComponentNode.prototype.tree = function(context, path, pos) {
  var new_context = new Context({}, context);
  var key, attr, value, source;
  for(key in this.attrs) {
    attr = this.attrs[key];
    if(attr.evaluate) {
      value = attr.evaluate(context);
      // todo : if expression attribute, add an alias
      if(value === false) {
        // nothing
      } else {
        new_context.set(key, value);
        source = bindingName(attr);
        if(source && key != source) {
          new_context.addAlias(source, key);
        }
      }
    } else {
      //new_context.set(key, value);
    }
  }
  if(this.component.controller){
    this.component.controller(new_context);
  }
  return this.component.template.treeChildren(new_context, path, pos);
};

ComponentNode.prototype.repr = function(level) {
  return this.component.template.repr(level + 1);
};

function createNode(parent, content, level, line, currentNode) {
  var node;
  if(content.length === 0) {
    node = new StringNode(parent, "\n", level, line+1);
  } else if(content.indexOf('#') === 0) {
    node = new CommentNode(parent, content, level, line+1);
  } else if(content.indexOf('if ') === 0) {
    node = new IfNode(parent, content, level, line+1);
  } else if(content.indexOf('elseif ') === 0) {
    node = new IfElseNode(parent, content, level, line+1, currentNode);
  } else if(content.indexOf('else') === 0) {
    node = new ElseNode(parent, content, level, line+1, currentNode);
  } else if(content.indexOf('for ') === 0) {
    node = new ForNode(parent, content, level, line+1);
  } else if(content.indexOf('include ') === 0) {
    node = new IncludeNode(parent, content, level, line+1);
  } else if(content.indexOf('component ') === 0) {
    node = new ComponentNode(parent, content, level, line+1);
  } else if(content.indexOf('"') === 0) {
    node = new StringNode(parent, content, level, line+1);
  } else if(/^\w/.exec(content)) {
    node = new HtmlNode(parent, content, level, line+1);
  } else if(content.indexOf('{{') === 0) {
    node = new ExpressionNode(parent, content, level, line+1);
  } else {
    throw new util.CompileError("createNode: unknow node type " + content);
  }
  return node;
}

function buildTemplate(tpl, templateName) {

  if(typeof tpl == 'object') {
    tpl = tpl.join('\n');
  }

  var root = new Node(null, "", 0), lines, line, level,
    content, i, currentNode = root, parent, searchNode;

  lines = tpl.split("\n");

  for(i=0; i<lines.length; i++) {
    line = lines[i];
    level = line.match(/\s*/)[0].length + 1;
    content = line.slice(level - 1);

    // multiline support: ends with a \
    var j = 0;
    while(content.match(/\\$/)) {
        j++;
        content = content.replace(/\\$/, '') + lines[i+j];
    }
    i = i + j;

    // multiline strings
    j = 0;
    if(content.match(/^"""/)) {
        content = content.replace(/^"""/, '"');
        while(!content.match(/"""$/)) {
            j++;
            if(i+j > lines.length) {
              throw new util.CompileError("Multiline string started but unfinished at line " + (i + 1));
            }
            content = content + lines[i+j];
        }
        content = content.replace(/"""$/, '"');
    }
    i = i + j;

    searchNode = currentNode;
    parent = null;

    // search for the parent node
    while(true) {

      if(level > searchNode.level) {
        parent = searchNode;
        break;
      }

      if(!searchNode.parent) {
        throw new util.CompileError("Indentation error at line " + (i + 1));
      }

      if(level == searchNode.level) {
        parent = searchNode.parent;
        break;
      }

      searchNode = searchNode.parent;
    }

    if(parent.children.length) {
      if(parent.children[0].level != level) {
        throw new util.CompileError("Indentation error at line " + (i + 1));
      }
    }

    var node = createNode(parent, content, level, i, currentNode);
    currentNode = node;

  }
  if(templateName) {
    templateCache[templateName] = root;
  }

  return root;
}

module.exports = {
  buildTemplate: buildTemplate,
  parseAttributes: parseAttributes,
  Context: Context,
  templateCache: templateCache,
  componentCache: componentCache,
  ContextName: ContextName
};
},{"./expression":1,"./render":3,"./util":5}],5:[function(_dereq_,module,exports){

"use strict";

function inherits(child, parent) {
  child.prototype = Object.create(parent.prototype);
  child.prototype.constructor = child;
}

function CompileError(msg) {
  this.name = "CompileError";
  this.message = (msg || "");
}
CompileError.prototype = Error.prototype;

function RuntimeError(msg) {
  this.name = "RuntimeError";
  this.message = (msg || "");
}
RuntimeError.prototype = Error.prototype;

function escape(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function trim(txt) {
  return txt.replace(/^\s+|\s+$/g ,"");
}

function event(name, data) {
  var evt = document.createEvent("CustomEvent");
  evt.initCustomEvent(name, false, false, data);
  return evt;
}

module.exports = {
  inherits:inherits,
  CompileError:CompileError,
  RuntimeError:RuntimeError,
  escape:escape,
  trim:trim,
  event:event
};
},{}]},{},[2])
(2)
});