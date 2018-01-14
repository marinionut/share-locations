angular.module('RDash')
	.controller('DashboardCtrl', ['$scope', '$rootScope', '$window', '$http', '$q', 'leafletData', 'FileSaver', DashboardCtrl]);

function DashboardCtrl($scope, $rootScope, $window, $http, $q, leafletData, FileSaver) {
    $scope.height = window.innerHeight;
    $scope.bucharest = {
        lat: 44.43328953788211,
        lng: 26.10729217529297,
        zoom: 8
    };
    $scope.markers = [];
    $scope.markersReadyForCommit = [];
    
    $scope.getMarkers = function() {
        $http({method: 'GET', url: '/api/locations/'+$rootScope.memberinfo.familie}).
        then(function(response) {
            if(response.data !== "fail") {
                $scope.markers = [];
                $scope.markersReadyForCommit = [];
                var result = response.data;
                var arrayLength = result.length;
                for (var i = 0; i < arrayLength; i++) {
                    $scope.markers.push({
                        lat: result[i].latitude,
                        lng: result[i].longitude,
                        message: result[i].message,
                        icon: {
                            type: 'awesomeMarker',
                            icon: 'star',
                            markerColor: $rootScope.memberinfo.id == result[i].uid ? "blue" : "red"
                        }
                    });
                }
            }
        });
    }

    if($rootScope.memberinfo) {
        $scope.getMarkers();
    } else {
        $http.get('/api/memberinfo').then(function(result){
            if(result.data.success){
                $rootScope.memberinfo = result.data.msg;
                $scope.getMarkers();
            }
        });
    }
    
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

    $scope.legend = {
        position: 'bottomleft',
        colors: [ '#38AADD', '#D33D2A'],
        labels: [ 'Eu', 'Familie']
    };

    $scope.adresa = "";
    $scope.$on("leafletDirectiveMap.map.click", function(event, args){
        var leafEvent = args.leafletEvent;
        geocodeLatLng(leafEvent.latlng);
    });


    function geocodeLatLng(latlng) {
        var geocoder= new google.maps.Geocoder();
        geocoder.geocode({'location': latlng}, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    $scope.adresa = convertUtf8ToAscii(results[0].formatted_address);
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
                } else {
                    window.alert('No results found');
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }
        });
    }

    $scope.addNewMarkers = function() {
        $http({method: 'PUT', data: $scope.markersReadyForCommit, url: '/api/locations/' + $rootScope.memberinfo.id}).
        then(function(response) {
            if(response.data.affectedRows == $scope.markersReadyForCommit.length) {
                $scope.deleteAddedMarkers();
                $scope.getMarkers();
            } else {
                $scope.deleteAddedMarkers();
            }
        });
    };

    $scope.deleteAddedMarkers = function() {
        for(i=0; i<$scope.markersReadyForCommit.length; i++)
            $scope.markers.pop();
        $scope.markersReadyForCommit = [];
    };

    $scope.exportLocations = function () {
        $http({method: 'GET', url: '/api/exportLocations/'+$rootScope.memberinfo.familie}).
        then(function(response) {
            if(response.data !== "fail") {
                var result = response.data;
                var data = new Blob([JSON.stringify(result)], { type: 'application/json' });
                FileSaver.saveAs(data, 'locations.json');
            }
        })
    };

    convertUtf8ToAscii = function (str) {
        str = str.replace(/[ă]/g,"a")
            .replace(/[â]/g,"a")
            .replace(/[î]/g,"i")
            .replace(/[ș]/g,"s")
            .replace(/[ț]/g,"t")
            .replace(/[Ă]/g,"A")
            .replace(/[Â]/g,"A")
            .replace(/[Î]/g,"I")
            .replace(/[Ș]/g,"S")
            .replace(/[Ț]/g,"T");
        return str;
    };

    $scope.importedFileName = "";
    $scope.showContent = function($fileContent, $fileName){
        $scope.importedFileContent = $fileContent;
        $scope.importedFileName = $fileName;
    };

    $scope.importLocations = function(){
        var importedLocations = [];
        importedLocations = JSON.parse($scope.importedFileContent);

        $http({method: 'PUT', data: importedLocations, url: '/api/importLocations/' + $rootScope.memberinfo.id}).
        then(function(response) {
            for(var i = 0 ; i < importedLocations.length; i++) {
                $scope.markers.push({
                    lat: importedLocations[i].latitude,
                    lng: importedLocations[i].longitude,
                    message: importedLocations[i].message
                });
            }
            alert("Locations added!");
        });
    };
}
