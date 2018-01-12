angular.module('RDash')
	.controller('FamilieCtrl', ['$scope', '$rootScope', '$http', FamilieCtrl]);

function FamilieCtrl($scope, $rootScope, $http) {

	console.log($rootScope.memberinfo);

	$scope.failMessage = "";
	$scope.currentFamily = {};
	$scope.familyMembers = [];
	$scope.newFamily = {};
	$scope.families = [];
	$scope.getFamilies = function(id) {
		if(id != 1) {
			$http({method: 'GET', url: '/api/families/'+id}).
			then(function(response) {
				if(response.data !== "fail")
					$scope.currentFamily = response.data[0];
			});
		} else {
			$http({method: 'GET', url: '/api/families'}).
			then(function(response) {
				$scope.families = response.data;
				$scope.families.shift();
				$scope.selectedFamily = $scope.families[0];
			});
		}
	}
	$scope.getFamilies($rootScope.memberinfo.familie);
	
	$scope.pickFamily = function() {
		$http({method: 'POST', data: $scope.selectedFamily, url: '/api/user/'+$rootScope.memberinfo.id}).
		then(function(response) {
			if(response.data.success) {
				$rootScope.memberinfo.familie = $scope.selectedFamily.id;
				if($scope.selectedFamily.id != 1)
					$scope.getMembers();
			}
		});
	}

	$scope.addFamily = function() {
		$http({method: 'PUT', data: $scope.newFamily, url: '/api/family'}).
		then(function(response) {
			if(response.data.success) {
				$rootScope.memberinfo.familie = response.data.msg;
				$scope.failMessage = "";
				$scope.selectedFamily = {id: response.data.msg, nume: ""};
				$scope.newFamily.nume = "";
				$scope.pickFamily();
			} else {
				$scope.failMessage = response.data.msg;
			}
		});
	}

	$scope.getMembers = function() {
		$http({method: 'GET', url: '/api/members/'+$rootScope.memberinfo.familie}).
		then(function(response) {
			if(response.data !== "fail")
				$scope.familyMembers = response.data;
		});
	}

	$scope.leaveFamily = function() {
		$scope.selectedFamily = {id: 1, nume: ""};
		$scope.familyMembers = [];
		$scope.pickFamily();
	}

	if($rootScope.memberinfo.familie != 1)
		$scope.getMembers();

	$rootScope.$watch('memberinfo.familie', function() {
		if(angular.isDefined($rootScope.memberinfo))
			$scope.getFamilies($rootScope.memberinfo.familie);
	});
}
