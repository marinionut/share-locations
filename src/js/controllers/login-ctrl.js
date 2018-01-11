angular.module('RDash')
	.controller('LoginCtrl', ['$scope', '$rootScope', '$state', 'AuthService', LoginCtrl]);

function LoginCtrl($scope, $rootScope, $state, AuthService) {
	$scope.user = {};
	$scope.failMessage = "";
	$scope.successMessage = "";

	$scope.login = function() {
		AuthService.login($scope.user).then(function(msg){
			$scope.failMessage = "";
			$scope.successMessage = "";
			$state.go('index');
		}, function(errMsg){
			$scope.failMessage = errMsg;
		});
	};

	$scope.register = function() {
		$rootScope.fromRegister = false;
		$state.go('register');
	}

	$rootScope.$watch('fromRegister', function() {
		if($rootScope.fromRegister) {
			$scope.failMessage = "";
			$scope.successMessage = "Inregistrare efectuata!";
		} else {
			$scope.successMessage = "";
		}
	});
}
