'use strict';

/**
 * Route configuration for the RDash module.
 */
angular.module('RDash').config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('index', {
                url: '/',
                templateUrl: 'templates/dashboard.html'
            })
            .state('templates', {
                url: '/templates',
                templateUrl: 'templates/templates.html'
            })
            .state('importExport', {
                url: '/importExport',
                templateUrl: 'templates/importExport.html'
            });
    }
]);