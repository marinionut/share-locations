angular.module('RDash')
	.controller('DashboardCtrl', ['$scope', '$rootScope', DashboardCtrl]);

function DashboardCtrl($scope, $rootScope) {
	$scope.height = window.innerHeight;
	$scope.bucharest = {
		lat: 44.43328953788211,
		lng: 26.10729217529297,
		zoom: 12
	};
	$scope.markers = {};

	$scope.layers = {
        baselayers: {
        	googleRoadmap: {
                name: 'Google Streets',
                layerType: 'ROADMAP',
                type: 'google'
            },
            googleTerrain: {
                name: 'Google Terrain',
                layerType: 'TERRAIN',
                type: 'google'
            },
            googleHybrid: {
                name: 'Google Hybrid',
                layerType: 'HYBRID',
                type: 'google'
            }
        }
    }

	$scope.$on("leafletDirectiveMarker.dragend", function(event, args){
		console.log(args.modelName+"_"+args.model.lat+"_"+args.model.lng);
	});

	$scope.events = { // or just {} //all events
		markers:{
			enable: [ 'dragend' ]
			//logic: 'emit'
		}
	};
}
