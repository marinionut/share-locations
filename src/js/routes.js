'use strict';

/**
 * Route configuration for the RDash module.
 */
angular.module('RDash')

.constant("AUTH", {
    "notAuthenticated" : "auth-not-authenticated",
    "authenticated" : "auth-authenticated"
})

.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('index', {
                url: '/',
                templateUrl: 'templates/dashboard.html'
            })
            .state('familie', {
                url: '/familie',
                templateUrl: 'templates/familie.html'
            })
            .state('importExport', {
                url: '/importExport',
                templateUrl: 'templates/importExport.html'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html'
            });
    }
])

.run(['$rootScope', '$state', 'AuthService', 
    function($rootScope, $state, AuthService) {
        $rootScope.$on('$stateChangeStart', function (event, next) {
            if (!AuthService.isAuthenticated()) {
              if (next.name !== 'login') {
                event.preventDefault();
                $state.go('login');
              }
            }
        });
    }
]);
