/**
 * Created by obladi on 14-6-19.
 */
require.config({
    baseUrl: "../js",
    paths: {
        "bindonce": "libs/bindonce",
        "angular": "libs/angular.min",
        "jquery": "libs/jquery-2.1.1.min",
        "Handlebars": "libs/handlebars-v1.3.0",
        "prototype": "libs/prototype",
        "app": "app"
    },
    shim: {
        'bindonce': { depts: ['angular']},
        'angular': {'exports': 'angular', depts: ['jquery']},
        'jquery': {'exports': 'jquery'},
        'Handlebars': {'exports': 'Handlebars'}
    }
});