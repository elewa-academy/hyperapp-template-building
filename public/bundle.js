(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
//  cred to https://github.com/jorgebucaran/hyperapp

try {
  module.exports = { app, h };
} catch(err) {
  // console.log('you in da browser. mec quoi');
}

// export function h(name, attributes) {
function h(name, attributes) {
  var rest = []
  var children = []
  var length = arguments.length

  while (length-- > 2) rest.push(arguments[length])

  while (rest.length) {
    var node = rest.pop()
    if (node && node.pop) {
      for (length = node.length; length--; ) {
        rest.push(node[length])
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node)
    }
  }

  return typeof name === "function"
    ? name(attributes || {}, children)
    : {
        nodeName: name,
        attributes: attributes || {},
        children: children,
        key: attributes && attributes.key
      }
}


// export function app(state, actions, view, container) {
function app(state, actions, view, container, trace) {

  var map = [].map
  var rootElement = (container && container.children[0]) || null
  var oldNode = rootElement && recycleElement(rootElement)
  var lifecycle = []
  var skipRender
  var isRecycling = true
  var globalState = clone(state)

  if (trace) {
    actions.logActions = () => () => (console.log(actions));
    actions.logState = () => state => (console.log(state));
    actions.logVdom = () => () => (console.log(resolveNode(view)));
  }
  var wiredActions = wireStateToActions([], globalState, clone(actions))
  if (trace) {
    var ignore;
    wiredActions.log = [];
    wiredActions.log.actions = {};
    for (let action in actions) { 
      wiredActions.log.actions[action] = true;
    };
    delete wiredActions.log.actions.logActions;
    delete wiredActions.log.actions.logState;
    delete wiredActions.log.actions.logVdom;
    wiredActions.logIgnore = (action) => {
          wiredActions.log.push('- ignoring ' + action);
          wiredActions.log.actions[action] = false;
        };
    wiredActions.logTrack = (action) => {
          wiredActions.log.push('- tracking ' + action);
          wiredActions.log.actions[action] = true;
        };
    wiredActions.logFlag = (message) => (wiredActions.log.push(message));
  }

  scheduleRender()

  return wiredActions

  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function(element) {
        return element.nodeType === 3 // Node.TEXT_NODE
          ? element.nodeValue
          : recycleElement(element)
      })
    }
  }

  // 
  function resolveNode(node) {
    return typeof node === "function"
      ? resolveNode(node(globalState, wiredActions))
      : node != null
        ? node
        : ""
  }

  function render() {
    skipRender = !skipRender

    var node = resolveNode(view)

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, (oldNode = node))
      /*-trace-*/  if (trace && !ignore) wiredActions.log.push( { virtual_dom: resolveNode(view) } )
    }

    isRecycling = false

    while (lifecycle.length) lifecycle.pop()()
  }

  function scheduleRender() {
    if (!skipRender) {
      skipRender = true
      setTimeout(render)
    }
  }

  function clone(target, source) {
    var out = {}

    for (var i in target) out[i] = target[i]
    for (var i in source) out[i] = source[i]

    return out
  }

  function setPartialState(path, value, source) {
    var target = {}
    if (path.length) {
      target[path[0]] =
        path.length > 1
          ? setPartialState(path.slice(1), value, source[path[0]])
          : value
      return clone(source, target)
    }
    return value
  }

  function getPartialState(path, source) {
    var i = 0
    while (i < path.length) {
      source = source[path[i++]]
    }
    return source
  }

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function"
        ? (function(key, action) {
            actions[key] = function(data) {
              var result = action(data)

              /*-trace-*/  if (trace) {
                if ( wiredActions.log.actions[key] ) {
                  let actionLog = {};
                  actionLog.action = key;
                  if (data !== undefined) actionLog.args = data;
                  wiredActions.log.push( actionLog );
                  ignore = false;
                } else {
                  ignore = true;
                };
              };

              if (typeof result === "function") {
                result = result(getPartialState(path, globalState), actions)
                /*-trace-*/  if (trace && !ignore) {
                  if (result !== undefined) {
                    let stateLog = {};
                    stateLog.partial_state = JSON.parse(JSON.stringify(result))
                    wiredActions.log.push( stateLog )
                  };
                };
              }

              if (
                result &&
                result !== (state = getPartialState(path, globalState)) &&
                !result.then // !isPromise
              ) {
                scheduleRender(
                  (globalState = setPartialState(
                    path,
                    clone(state, result),
                    globalState
                  ))
                )
              }

              return result
            }
          })(key, actions[key])
        : wireStateToActions(
            path.concat(key),
            (state[key] = clone(state[key])),
            (actions[key] = clone(actions[key]))
          )
    }

    return actions
  }

  function getKey(node) {
    return node ? node.key : null
  }

  function eventListener(event) {
    return event.currentTarget.events[event.type](event)
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") {
    } else if (name === "style") {
      if (typeof value === "string") {
        element.style.cssText = value
      } else {
        if (typeof oldValue === "string") oldValue = element.style.cssText = ""
        for (var i in clone(oldValue, value)) {
          var style = value == null || value[i] == null ? "" : value[i]
          if (i[0] === "-") {
            element.style.setProperty(i, style)
          } else {
            element.style[i] = style
          }
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        name = name.slice(2)

        if (element.events) {
          if (!oldValue) oldValue = element.events[name]
        } else {
          element.events = {}
        }

        element.events[name] = value

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener)
          }
        } else {
          element.removeEventListener(name, eventListener)
        }
      } else if (
        name in element &&
        name !== "list" &&
        name !== "type" &&
        name !== "draggable" &&
        name !== "spellcheck" &&
        name !== "translate" &&
        !isSvg
      ) {
        element[name] = value == null ? "" : value
      } else if (value != null && value !== false) {
        element.setAttribute(name, value)
      }

      if (value == null || value === false) {
        element.removeAttribute(name)
      }
    }
  }

  function createElement(node, isSvg) {
    var element =
      typeof node === "string" || typeof node === "number"
        ? document.createTextNode(node)
        : (isSvg = isSvg || node.nodeName === "svg")
          ? document.createElementNS(
              "http://www.w3.org/2000/svg",
              node.nodeName
            )
          : document.createElement(node.nodeName)

    var attributes = node.attributes
    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function() {
          attributes.oncreate(element)
        })
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(
          createElement(
            (node.children[i] = resolveNode(node.children[i])),
            isSvg
          )
        )
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg)
      }
    }

    return element
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    for (var name in clone(oldAttributes, attributes)) {
      if (
        attributes[name] !==
        (name === "value" || name === "checked"
          ? element[name]
          : oldAttributes[name])
      ) {
        updateAttribute(
          element,
          name,
          attributes[name],
          oldAttributes[name],
          isSvg
        )
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate
    if (cb) {
      lifecycle.push(function() {
        cb(element, oldAttributes)
      })
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes
    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i])
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element)
      }
    }
    return element
  }

  function removeElement(parent, element, node) {
    function done() {
      parent.removeChild(removeChildren(element, node))
    }

    var cb = node.attributes && node.attributes.onremove
    if (cb) {
      cb(element, done)
    } else {
      done()
    }
  }

  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {
    } else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      var newElement = createElement(node, isSvg)
      parent.insertBefore(newElement, element)

      if (oldNode != null) {
        removeElement(parent, element, oldNode)
      }

      element = newElement
    } else if (oldNode.nodeName == null) {     
      element.nodeValue = node
    } else { 
      updateElement(
        element,
        oldNode.attributes,
        node.attributes,
        (isSvg = isSvg || node.nodeName === "svg")
      )

      var oldKeyed = {}
      var newKeyed = {}
      var oldElements = []
      var oldChildren = oldNode.children
      var children = node.children

      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i]

        var oldKey = getKey(oldChildren[i])
        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]]
        }
      }

      var i = 0
      var k = 0

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i])
        var newKey = getKey((children[k] = resolveNode(children[k])))

        if (newKeyed[oldKey]) {
          i++
          continue
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i])
          }
          i++
          continue
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg)
            k++
          }
          i++
        } else {
          var keyedNode = oldKeyed[newKey] || []

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg)
            i++
          } else if (keyedNode[0]) {
            patch(
              element,
              element.insertBefore(keyedNode[0], oldElements[i]),
              keyedNode[1],
              children[k],
              isSvg
            )
          } else {
            patch(element, oldElements[i], null, children[k], isSvg)
          }

          newKeyed[newKey] = children[k]
          k++
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i])
        }
        i++
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1])
        }
      }
    }
    return element
  }
}

},{}],2:[function(require,module,exports){
'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var logic = require('./logic.js');

var actions = {
  save: function save() {
    return function (state) {
      var new_entry = logic.save(state.operation, state.a, state.b, state.current_result);
      state.saved.push(new_entry);
      return { saved: state.saved };
    };
  },
  set: function set(value) {
    return function () {
      return _defineProperty({}, value.key, value.value);
    };
  },
  operate: function operate() {
    return function (state) {
      var result = logic.operate(state.operation, Number(state.a), Number(state.b), state.last_result);
      return { current_result: result, last_result: state.current_result };
    };
  },
  subapp: {
    set: function set(value) {
      return function () {
        return _defineProperty({}, value.key, value.value);
      };
    }
  }
};

module.exports = actions;

},{"./logic.js":4}],3:[function(require,module,exports){
(function (global){
'use strict';

// this file is for building


// components
global.state = require('./state.js');
global.actions = require('./actions.js');
global.view = require('./views.js').main;

// hyperapp 
global.app = require('self-tracing-hyperapp').app;

global.container = document.getElementById('container');
global.hyper = app(state, actions, view, container, true);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./actions.js":2,"./state.js":5,"./views.js":6,"self-tracing-hyperapp":1}],4:[function(require,module,exports){
"use strict";

var operations = {
    add: function add(a, b) {
        return a + b;
    },
    subtract: function subtract(a, b) {
        return a - b;
    },
    multiply: function multiply(a, b) {
        return a * b;
    },
    divide: function divide(a, b) {
        return a / b;
    }
};

var operate = function operate(operation, a, b, last_result) {
    a = a;
    b = b === Boolean(b) ? last_result : b;
    var result = operations[operation](a, b);
    return result;
};

var save = function save(operation, a, b, result) {
    var saved_operation = {};
    saved_operation.operation = operation;
    saved_operation.a = a;
    saved_operation.b = b;
    saved_operation.result = result;
    return saved_operation;
};

module.exports = { operate: operate, save: save, operations: operations };

},{}],5:[function(require,module,exports){
'use strict';

var state = {
  a: 0,
  b: 0,
  operation: 'add',
  current_result: 0,
  last_result: 0,
  saved: [],
  subapp: {
    a: 0
  }
};

module.exports = state;

},{}],6:[function(require,module,exports){
"use strict";

var h = require('self-tracing-hyperapp').h;

var input_component = function input_component(set, key, value) {
  return h("input", {
    id: key,
    onkeyup: function onkeyup(e) {
      return set({ key: key, value: e.target.value });
    },
    type: "text",
    value: value });
};

var button_component = function button_component(text, action) {
  return h("button", { onclick: function onclick() {
      return action();
    } }, text);
};

var main = function main(state, actions) {
  return h("main", null, h("h1", null, "current: " + state.current_result), h("div", null, input_component(actions.set, 'operation', state.operation), input_component(actions.set, 'a', state.a), input_component(actions.set, 'b', state.b)), h("div", { className: "form-buttons" }, button_component('operate', actions.operate), button_component('save', actions.save)), h("h1", null, "last: " + state.last_result), input_component(actions.subapp.set, 'a', state.subapp.a));
};

module.exports = { main: main, button_component: button_component, input_component: input_component };

},{"self-tracing-hyperapp":1}]},{},[3]);
