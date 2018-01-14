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
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html'
            })
            .state('register', {
                url: '/register',
                templateUrl: 'templates/register.html'
            });
    }
])

.run(['$rootScope', '$state', '$http', 'AuthService', 
    function($rootScope, $state, $http, AuthService) {
        $rootScope.$on('$stateChangeStart', function (event, next) {
            if (!AuthService.isAuthenticated()) {
              if (next.name !== 'login' && next.name !== 'register') {
                event.preventDefault();
                $state.go('login');
              }
            } else {
            	if(!angular.isDefined($rootScope.memberinfo) && next.name !== 'register') {
            		$http({method: 'GET', url: '/api/memberinfo'}).
            		then(function(response) {
            			if(response.data.success)
            				$rootScope.memberinfo = response.data.msg;
            		});
            	}
            }
        });
    }
]);
