/**
 * Created by obladi on 14-6-19.
 */
require.config({
    baseUrl: "../js/",
    paths: {
        "angular": "libs/angular.min",
        "jquery": "libs/jquery-2.1.1.min",
        "Handlebars": "libs/handlebars-v1.3.0",
        "prototype": "prototype",
        "app": "app"
    },
    shim: {
        'angular': {'exports': 'angular'},
        'jquery': {'exports': 'jquery'},
        'Handlebars': {'exports': 'Handlebars'}

    }
});