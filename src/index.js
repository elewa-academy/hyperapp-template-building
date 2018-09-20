// this file is for building


// components
global.state = require('./state.js');
global.actions = require('./actions.js');
global.view = require('./views.js').main;

// hyperapp 
global.app = require('self-tracing-hyperapp').app;

global.container = document.getElementById('container');
global.hyper = app(state, actions, view, container, true);