angular.module('RDash')
	.controller('DashboardCtrl', ['$scope', DashboardCtrl]);

function DashboardCtrl($scope) {
	$scope.height = window.innerHeight;
	$scope.bucharest = {
		lat: 44.43328953788211,
		lng: 26.10729217529297,
		zoom: 12
	};
	$scope.markers = {};
	$scope.layers = {
		baselayers: {
			osm: {
				name: "OpenStreetMap",
				type: "xyz",
				url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
				layerOptions: {
					subdomains: ['a', 'b', 'c'],
					attribution: "© OpenStreetMap contributors",
					continuousWorld: true
				}
			}
		},
		overlays: {}
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
