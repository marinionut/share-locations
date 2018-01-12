angular.module('RDash')
	.controller('RegisterCtrl', ['$scope', '$rootScope', '$state', '$http', RegisterCtrl]);

function RegisterCtrl($scope, $rootScope, $state, $http) {
	$scope.user = {};
	$scope.failMessage = "";

	$scope.addUser = function() {
		$http({method: 'PUT', data: $scope.user, url: '/api/register'}).
		then(function(response) {
			if(response.data.success) {
				$rootScope.fromRegister = true;
				$state.go('login');
			} else {
				$scope.failMessage = response.data.msg;
			}
		});
	}
}
