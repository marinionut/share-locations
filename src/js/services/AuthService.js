angular.module('RDash')
	.service('AuthService', ['$q', '$http', '$rootScope', 'AUTH', AuthService]);

function AuthService($q, $http, $rootScope, AUTH) {
	var LOCAL_TOKEN_KEY = undefined;
	var isAuthenticated = false;
	var authToken;

	function loadUserCredentials() {
		var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
		if(token){
			useCredentials(token);
		}
	}

	function storeUserCredentials(token) {
		window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
		useCredentials(token);
	}

	function useCredentials(token) {
		isAuthenticated = true;
		authToken = token;
		// Set the token as header for your requests!
		$http.defaults.headers.common.Authorization = authToken;
	}

	function destroyUserCredentials() {
		authToken = undefined;
		isAuthenticated = false;
		$http.defaults.headers.common.Authorization = undefined;
		window.localStorage.removeItem(LOCAL_TOKEN_KEY);
	}

	function login(user) {
		return $q(function(resolve, reject) {
			$http.post('/api/authenticate', user)
			.then(function(result) {
				if(result.data.success) {
					storeUserCredentials(result.data.token);
					$rootScope.$broadcast(AUTH.authenticated);
					resolve("Authenticated successfully");
				} else {
					reject(result.data.msg);
				}
			});
		});
	};

	function logout() {
		destroyUserCredentials();
	};

	loadUserCredentials();

	return {
		login: login,
		logout: logout,
		isAuthenticated: function() {return isAuthenticated;}
	};
};

angular.module('RDash')
	.factory('AuthInterceptor', ['$rootScope', '$q', 'AUTH', AuthInterceptor]);
function AuthInterceptor($rootScope, $q, AUTH) {
	return {
		responseError: function(response) {
			$rootScope.$broadcast({
				401: AUTH.notAuthenticated,
			}[response.status], response);
			return $q.reject(response);
		}
	}
};

angular.module('RDash').config(['$httpProvider', function($httpProvider){
	$httpProvider.interceptors.push('AuthInterceptor');
}]);
