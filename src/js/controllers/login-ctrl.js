angular.module('RDash')
	.controller('LoginCtrl', ['$scope', '$state', 'AuthService', LoginCtrl]);

function LoginCtrl($scope, $state, AuthService) {
	$scope.user = {};

	$scope.failMessage = '';

	$scope.login = function() {
		AuthService.login($scope.user).then(function(msg){
			$scope.failMessage = '';
			$state.go('index');
		}, function(errMsg){
			$scope.failMessage = errMsg;
		});
	};
}
