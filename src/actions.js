let logic = require('./logic.js');

const actions = {
  save: () => state => {
      let new_entry = logic.save(
                state.operation, 
                state.a, 
                state.b, 
                state.current_result
      );
      state.saved.push(new_entry);
      return { saved: state.saved };
    },
  set: value => () => ( { [value.key]: value.value } ),
  operate: () => state => {
      let result = logic.operate(
                state.operation, 
                Number(state.a), 
                Number(state.b), 
                state.last_result
      );
      return { current_result: result, last_result: state.current_result };
    },
  subapp: {
    set: value => () => ( { [value.key]: value.value } ),
  }
};

module.exports = actions;