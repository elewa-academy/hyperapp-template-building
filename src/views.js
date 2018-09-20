let h = require('self-tracing-hyperapp').h;

const input_component = (set, key, value) => { return (
    h("input", {
      id: key,
      onkeyup: function onkeyup(e) { return set( { key, value: e.target.value } ); },
      type: "text",
      value: value })
)};

const button_component = (text, action) => { return (
	h("button", { onclick: function onclick() {return  action(); } }, text)
)};

const main = (state, actions) => { return (
    h("main", null,
      h("h1", null, "current: " + state.current_result),
      h("div", null,
        input_component(actions.set, 'operation', state.operation),
        input_component(actions.set, 'a', state.a),
        input_component(actions.set, 'b', state.b)),
      h("div", { className: "form-buttons" },
        button_component('operate', actions.operate),
        button_component('save', actions.save)),
      h("h1", null, "last: " + state.last_result),
      input_component(actions.subapp.set, 'a', state.subapp.a))
)};

module.exports = { main, button_component, input_component };