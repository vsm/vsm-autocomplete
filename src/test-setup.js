// This code is included before the tests that are run via 'npm run test'.


// Add JSDOM: a browser environment for Node, so that vue-test-utils can run.
require('jsdom-global')();


// Prevent Vue warning, and make `Vue` globally available.
const Vue = require('vue');
Vue.config.productionTip = false;
global.Vue = Vue;


// Make `should` and `expect` globally available.
const chai = require('chai');
chai.should();
global.expect = chai.expect;
