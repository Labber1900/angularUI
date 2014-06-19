/**
 * Created by obladi on 14-6-19.
 */
require.config({
    baseUrl: "../js/",
    paths: {
        "jQuery": "libs/jquery-2.1.1.min",
        "angular": "libs/angular.min",
        "Handlebars": "libs/handlebars-v1.3.0",
        "prototype": "prototype",
        "directive": "directive"
    },
    shim: {
        'angular': {'exports': 'angular'},
        'jQuery': {'exports': 'jQuery'}
    }
});