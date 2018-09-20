let operations = {
  add: (a, b) => {
  	return a + b;
  },
  subtract: (a, b) => {
  	return a - b;
  },
  multiply: (a, b) => {
  	return a * b;
  },
  divide: (a, b) => {
  	return a / b;
  }
};

let operate = (operation, a, b, last_result) => {
    a = a;
    b = b === Boolean(b) ? last_result : b;
    let result = operations[operation](a, b);
    return result;
};

let save = (operation, a, b, result) => {
    let saved_operation = {};
    saved_operation.operation = operation;
    saved_operation.a = a;
    saved_operation.b = b;
    saved_operation.result = result;
    return saved_operation;
};


module.exports = { operate, save, operations };
