angular.module('RDash')
	.controller('DashboardCtrl', ['$scope', '$rootScope', '$window', '$http', 'leafletData', DashboardCtrl]);

function DashboardCtrl($scope, $rootScope, $window, $http, leafletData) {

    console.log($rootScope.memberinfo);

    $scope.height = window.innerHeight;
    $scope.bucharest = {
        lat: 44.43328953788211,
        lng: 26.10729217529297,
        zoom: 8
    };
    $scope.markers = [];

    $http({method: 'GET', url: '/api/locations/'+$rootScope.memberinfo.familie}).
    then(function(response) {
        if(response.data !== "fail") {
            var result = response.data;


            var arrayLength = result.length;
            console.log(result.data);

            for (var i = 0; i < arrayLength; i++) {
                console.log($rootScope.memberinfo.id + " " + result[i].uid);
                $scope.markers.push({
                    lat: result[i].latitude,
                    lng: result[i].longitude,
                    icon: {
                        type: 'awesomeMarker',
                        icon: 'tag',
                        markerColor: $rootScope.memberinfo.id == result[i].uid ? "blue" : "red"
                    }
                });
            }
            console.log($scope.markers);
        }
    });



    $scope.markersReadyForCommit = [];

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
    };

    $scope.events = {};

    $scope.adresa = "default name";

    $scope.$on("leafletDirectiveMap.map.click", function(event, args){
        var leafEvent = args.leafletEvent;
        geocodeLatLng(leafEvent.latlng);
    });


    function geocodeLatLng(latlng) {
        var geocoder= new google.maps.Geocoder();
        geocoder.geocode({'location': latlng}, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    $scope.adresa = results[0].formatted_address;
                    $scope.markers.push({
                        lat: latlng.lat,
                        lng: latlng.lng,
                        message: $scope.adresa
                    });
                    $scope.markersReadyForCommit.push({
                        lat: latlng.lat,
                        lng: latlng.lng,
                        message: $scope.adresa
                    });
                    //console.log($scope.markers);
                    //console.log($scope.markersReadyForCommit);
                } else {
                    window.alert('No results found');
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }
        });
    }

    $scope.addNewMarkers = function() {
        console.log($scope.markersReadyForCommit);
        $http({method: 'PUT', data: $scope.markersReadyForCommit, url: '/api/locations/' + $rootScope.memberinfo.id}).
        then(function(response) {
            if(response.data.success) {
                console.log(response.data);
            } else {
                console.log(response.data.msg);
            }
        });
    };

}
