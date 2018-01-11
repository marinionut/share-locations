angular.module('RDash')
	.controller('FamilieCtrl', ['$scope', '$rootScope', FamilieCtrl]);

function FamilieCtrl($scope, $rootScope) {
	console.log($rootScope.memberinfo);
}
