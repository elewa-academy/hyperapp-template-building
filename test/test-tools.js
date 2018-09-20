const assert = require('tressa');


function test_logic(logic, cases) {
  for (let t_case of cases) {
    let args = t_case.arg;
    let actual = logic(...args);
    let actual_string = JSON.stringify(actual);
    let expected = t_case.expected;
    let expected_string = JSON.stringify(expected);
    assert(actual_string === expected_string, 
        {arg, expected, actual} )
  };
};


function test_action(action, cases) {

  for (let t_case of cases) {
    let arg = t_case.arg;
    let _state = t_case.state;
    let actual = evaluate_action(action, arg, _state);
    let actual_string = JSON.stringify(actual);
    let expected = t_case.expected;
    let expected_string = JSON.stringify(expected);
    assert(actual_string === expected_string, 
        {arg, expected, actual} )
  };

  function evaluate_action(action, args, state) {
    const curried_action = action(args);
    const result = curried_action(state);
    return result;
  };
};

function test_view(component, args, expected) {
	let actual = component(...args);
	let actual_string = JSON.stringify(actual);
	let expected_string = JSON.stringify(expected);
	return expected_string === actual_string;
};

module.exports = { test_logic, test_action, test_view };