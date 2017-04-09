// Initializes AngularJS App
var app = angular.module('airport_connect', ['ui.router', 'leaflet-directive']);
var domain = 'http://localhost:5000/';
var basemap = 'https://api.mapbox.com/styles/v1/jesslyn-landgren/ciw6blbhw001u2kmgu04klrja/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamVzc2x5bi1sYW5kZ3JlbiIsImEiOiJ4VUxXQ1BZIn0.6tb-5bu-J-kVGvAbTn6MQQ';

//App Service for accessing the API
app.factory('AirportConnect', function($http) {
    var service = {};
    //Searches for nodes based on a query
    service.getSearchResults = function(query, origin) {
        var url = '/search';
        return $http({
            method: 'GET',
            url: url,
            params: {
                query: query,
                origin_id: origin.id
            }
        });
    };
    //Returns route object (array of nodes and array of instructions) given origin and destination
    service.getRoute = function(origin, destination) {
        var url = '/shortest_path';
        return $http({
            method: 'GET',
            url: url,
            params: {
                origin: origin.id,
                destination: destination.id
            }
        });
    };
    //Gets all points in graph (ONLY USED FOR DEBUGGING)
    service.getAllPoints = function() {
        var url = '/all_points';
        return $http({
            method: 'GET',
            url: url,
        });
    };
    return service;
});

//Controller for page
app.controller('NavController', function($scope, $state, AirportConnect, leafletData) {

    //Display splash screen on app load
    $scope.home= true;

    //Navigation view elements are hidden by default
    $scope.navigating = false;

    //Initialize Leaflet Map with Geolocation control
    angular.extend($scope, {
        //Sets map view centered at ATL airport
        center: {
            lat: 33.640952,
            lng: -84.433220,
            zoom: 14
        },
        //Attaches mapbox light tile layer
        defaults: {
            maxZoom: 20,
            zoomControl: false,
            tileLayer: basemap,
            tileLayerOptions: {maxZoom:20}
        },
        //Adds geolocation control button to map interface
        controls: {
            custom: [
                L.control.locate({
                    clickBehavior: {
                      inView: 'setView',
                      outOfView: 'setView'
                    },
                    drawCircle: false,
                    icon: 'fa fa-crosshairs geolocate',
                    locateOptions: {
                        watch: false
                    },
                    position: 'bottomright'
                })
            ]
        }
    });

    //Called to hide splash page
    $scope.useApp = function (){
        $scope.home = false;
        $scope.getOrigin();
    };

    $scope.getDistance = function(originLat,originLng,destLat,destLng){
      return Math.sqrt((Math.pow(destLng - originLng),2) + (Math.pow(destLng - originLng,2)));
    }

    //Finds the node in the graph closest to the user's location
    $scope.getOriginNode = function (a,b){
      var shortestDistance = 100;
      var nearestPoint = {};
      $scope.geoJSON.forEach(function(e){
        // console.log(e.geometry.coordinates);
        var distance = $scope.getDistance(a,b,parseFloat(e.geometry.coordinates[1]),parseFloat(e.geometry.coordinates[0]))
        if(distance < shortestDistance){
          shortestDistance = distance;
          nearestPoint = e;
        }
      });
      return nearestPoint;

    };

    //Get the geolocation of the user and set to origin for later API calls
    $scope.getOrigin = function (){
        leafletData.getMap('map').then(function(map) {
            //Try to get user location
            map.locate({
                watch: false,
                setView: false,
                timeout: 3000,
                maximumAge: 20000,
                enableHighAccuracy: true
            });

            console.log("Everything shoud be printed below");


            //If the user location is found
            map.on('locationfound', function (e) {

              console.log("LOCATION_FOUND");
              let p =  $scope.getOriginNode(e.latlng.lat, e.latlng.lng);
                $scope.origin = {
                "id": p.properties.name,
            		"name": p.properties.realname,
            		"latitude": p.geometry.coordinates[1],
            		"longitude": p.geometry.coordinates[0],
            		"poi_type": p.properties.type,
            		"concourse": p.properties.concourse
                };

            });
            //If the user location is NOT found
            map.on('locationerror', function(e) {
                console.log("LOCATION_ERROR");
                $scope.origin = {
                "id": "42",
            		"name": "B8",
            		"latitude": "33.638719",
            		"longitude": "-84.436027",
            		"poi_type": "gate",
            		"concourse": "B"
                };
            });
        });
    };

    // Creates GeoJSON for all points (network nodes) - ONLY USED FOR DIAGNOSTICS

    $scope.geoJSON = [];
    $scope.getAllPoints = function(){
        AirportConnect.getAllPoints().success(function(all_points){
            var points = [];
            for (var point in all_points) {
                var geoJSON = {
                    "type": "Feature",
                        "properties": {
                            "concourse": all_points[point].concourse,
                            "name": all_points[point].id,
                            "type": all_points[point].poi_type,
                            "realname": all_points[point].name
                        }, "geometry":{
                            "type": "Point",
                            "coordinates": [all_points[point].longitude, all_points[point].latitude]
                        }
                };
                $scope.geoJSON.push(geoJSON);
            }
            //////////////// KEYUR COMMENT HERE TO TURN ON LABELS ///////////////////
            //Draws all the points in the network on the map every time page is loaded.
            // $scope.drawAllPoints();
        });
    };

    // Displays all points using their GeoJSON data
    $scope.drawAllPoints = function(){
        leafletData.getMap('map').then(function(map) {
            var pointMarkerStyle = {
                radius: 3,
                opacity: 1,
                fillOpacity: 1
            };
            L.geoJSON($scope.geoJSON, {
                style: function(feature) {
                    return {color: '#5fad75'};
                      switch (feature.properties.poi_type) {
                        case 'station':   return {color: '#ffa100'};
                        case 'center':   return {color: "#0000ff"};
                        case 'hcenter':   return {color: "#0000ff"};
                        case 'gate': return {color: "#ff0000"};
                        case 'center':   return {color: "#0000ff"};
                        case 'concourse':   return {color: "#0000ff"};
                        case 'toilet':   return {color: "#0000ff"};
                        case 'coffee':   return {color: "#0000ff"};
                        case 'fast_food':   return {color: "#0000ff"};
                        case 'restaurant':   return {color: "#0000ff"};
                    }
                },
                pointToLayer: function (feature, latlng){
                    // return L.circleMarker(latlng, pointMarkerStyle);
                    myIcon = L.divIcon({
                        className: 'label',
                        html: feature.properties.name,
                        iconSize: [100, 40]
                    });
                    return L.marker(latlng, {icon: myIcon});
                }
            }).addTo(map);
        });
    };


    $scope.getAllPoints();
    /////////////////////////////////////////////////////////////////////////

    //Search All Routes given an origin point object
    $scope.search = function() {
        console.log($scope.query);

        leafletData.getMap('map').then(function(map) {
            //Try to get user location
            map.locate({
                watch: false,
                setView: false,
                timeout: 3000,
                maximumAge: 20000,
                enableHighAccuracy: true
            });
            //If the user location is found
            map.on('locationfound', function (e) {
                console.log("LocationFound");
                console.log("current location",e.latlng, e.accuracy);
                // $scope.getOriginNode(e.latlng.lat, e.latlng.lng);
                let k =  $scope.getOriginNode(e.latlng.lat, e.latlng.lng);
                  $scope.origin = {
                  "id": k.properties.name,
              		"name": k.properties.realname,
              		"latitude": k.geometry.coordinates[1],
              		"longitude": k.geometry.coordinates[0],
              		"poi_type": k.properties.type,
              		"concourse": k.properties.concourse
                  };

            });
            // If the user location is NOT found
            map.on('locationerror', function(e) {
                console.log("LocationError");
                $scope.origin = {
                "id": "42",
            		"name": "B8",
            		"latitude": "33.638719",
            		"longitude": "-84.436027",
            		"poi_type": "gate",
            		"concourse": "B"
                };
            });
        });

        if($scope.query.length > 1){
        //Call search API and bind results to scope variable
        AirportConnect.getSearchResults($scope.query, $scope.origin).success(function(searchResults) {
            $scope.results = searchResults;
            // console.log(JSON.stringify($scope.results))
            if ($scope.results.length > 0){
                $scope.show_results = true;
            } else {
                $scope.show_results = false;
            }
        }).error(function(){
            $scope.show_results= false;
        });
      }
    };

    //Handles the page view changes and API request for retrieving and showing a route

    $scope.startRoute = function (selectedDestination) {
        //Set variables to show navigation view elements and hide search view elements
        //sets time footer ng-if boolean to true & hides search bar ng-if
        $scope.navigating = true;
        $scope.show_all_steps = false;
        $scope.arrived = false;

        //Shows or Hides list of navigation steps for current route (called every time the chevron icon is clicked)
        $scope.showSteps = function(){
            console.log('Show Steps');
            $scope.show_all_steps = !$scope.show_all_steps;
        };

        //Set scope destination to node clicked by user in search results
        $scope.destination = selectedDestination;
        // console.log($scope.destination);

        //Calls the service method that calls the API route to get a graph route given an origin and destination node
        AirportConnect.getRoute($scope.origin, $scope.destination).success(function(routeResult) {
            //Separates the point and instruction arrays returned in the JSON object
            $scope.route_points = routeResult.points;
            $scope.instructions = routeResult.instructions;
            $scope.dist_to_dest = routeResult.dist_to_dest;
            // Create an arrary of steps from instructions array(eliminates instructions for points where instruction does not change)
            var previous_step = '';
            var current_step = '';
            var steps = [];
            var dist = 0;
            var distance = [];
            for (var i=0; i<$scope.instructions.length; i++){
                if (i===0){
                    let this_dist = distance.push($scope.dist_to_dest[i] - $scope.dist_to_dest[i+1]);
                    steps.push({
                                instruction: $scope.instructions[i],
                                 distance : parseInt(this_dist)
                               });
                } else if (i < $scope.instructions.length-1){

                    dist = dist + $scope.dist_to_dest[i] - $scope.dist_to_dest[i+1];
                    previous_step = $scope.instructions[i-1];
                    current_step = $scope.instructions[i];
                    if (current_step !== previous_step) {
                      steps.push({
                                  instruction: current_step,
                                   distance : parseInt(dist)
                                 });
                        // steps.push(current_step);
                        // distance.push(dist);
                        dist = 0;
                    }
                  }
                else {
                    previous_step = $scope.instructions[i-1];
                    current_step = $scope.instructions[i];
                    steps.push({
                                 instruction: $scope.instructions[i],
                                 distance : parseInt($scope.dist_to_dest[i-1])
                               });
                    // steps.push($scope.instructions[i]);
                    // distance.push($scope.dist_to_dest[i-1]);
                }

            }

            // $scope.distance = distance;
            $scope.steps = steps;
            // console.log(steps);
            // console.log("Distance Array Length",distance.length,"Steps Array Length",steps.length);
            // console.log($scope.steps);

            //Assigns route point array and instruction array to new variables to use in block that checks user position within route (so original route variables won't be modified)
            $scope.point_route_check = routeResult.points;
            $scope.instructions_check = routeResult.instructions;
            $scope.dist_to_dest_check = routeResult.dist_to_dest;

            ///////CONVERTS ARRAY OF ROUTE POINTS (JSON) TO GEOJSON FOR DISPLAY
            $scope.line_coord = [];
            $scope.originGeoJSON = [];
            $scope.destGeoJSON = [];
            $scope.stationsGeoJSON = [];
            var last = ($scope.route_points.length-1).toString();
            for (var point in $scope.route_points) {
                for (var test in $scope.route_points[point]){
                    var current_node = $scope.route_points[point][test];
                    var tempGeoJSON = {
                        "type": "Feature",
                            "properties": {
                                // "concourse": $scope.route_points[point].concourse,
                                // "name": $scope.route_points[point].name,
                                "type": current_node.poi_type
                            }, "geometry":{
                                "type": "Point",
                                "coordinates": [current_node.longitude, current_node.latitude]
                            }
                    };
                    $scope.line_coord.push([current_node.longitude, current_node.latitude]);
                    // console.log($scope.line_coord);
                    if (point === '0'){
                        // console.log("got origin");
                        $scope.originGeoJSON.push(tempGeoJSON);
                        $scope.origin_lat = parseFloat(current_node.latitude);
                        $scope.origin_lng = parseFloat(current_node.longitude);
                    } else if (point === last) {
                        // console.log("got dest");
                        $scope.destGeoJSON.push(tempGeoJSON);
                        $scope.destination_lat = parseFloat(current_node.latitude);
                        $scope.destination_lng = parseFloat(current_node.longitude);
                    } else if (current_node.poi_type === 'escalator'){
                        // console.log("got train station");
                        $scope.stationsGeoJSON.push(tempGeoJSON);
                    }
                    break;
                }

            }
            $scope.line = {
                "type": "Feature",
                    "properties": {
                    }, "geometry":{
                        "type": "LineString",
                        "coordinates": $scope.line_coord
                    }
            };

            ///Calls function to draw the route on the map using GEOJSON from above
            $scope.drawRoute();

            //Sets bounds of map to zoom to entire route
            leafletData.getMap('map').then(function(map) {
                map.fitBounds(L.latLngBounds([$scope.origin_lat, $scope.origin_lng], [$scope.destination_lat, $scope.destination_lng]));
            });
            ////////////////////////////////////////////////////////////////////////
        });

        // Draws Route Path
        $scope.drawRoute = function(){
            leafletData.getMap('map').then(function(map) {

                // var originStyle = {
                //     radius: 5,
                //     fillColor: "#5fad75",
                //     color: "#5fad75",
                //     weight: 1,
                //     opacity: 1,
                //     fillOpacity: 1
                // };
                //
                // var destinationStyle = {
                //     radius: 5,
                //     fillColor: "#ef473a",
                //     color: "#ef473a",
                //     weight: 1,
                //     opacity: 1,
                //     fillOpacity: 1
                // };
                //
                // var stationStyle = {
                //     radius: 5,
                //     fillColor: "#5c5c5c",
                //     color: "#5c5c5c",
                //     weight: 1,
                //     opacity: 1,
                //     fillOpacity: 1
                // };
                //Plot points
                L.geoJSON($scope.originGeoJSON, {
                    pointToLayer: function (feature, latlng){
                        // return L.circleMarker(latlng, pointMarkerStyle);
                        myIcon = L.divIcon({
                            className: 'label',
                            html: '<i class="fa fa-map-pin" style="font-size: 2em; color: #56b881;" aria-hidden="true"></i>'
                        });
                        return L.marker(latlng, {icon: myIcon});
                    }
                }).addTo(map);

                L.geoJSON($scope.destGeoJSON, {
                    pointToLayer: function (feature, latlng){
                        // return L.circleMarker(latlng, pointMarkerStyle);
                        myIcon = L.divIcon({
                            className: 'label',
                            html: '<i class="fa fa-flag" style="font-size: 2em; color: #ef473a;" aria-hidden="true"></i>'
                        });
                        return L.marker(latlng, {icon: myIcon});
                    }
                }).addTo(map);

                L.geoJSON($scope.stationsGeoJSON, {
                    // pointToLayer: function (feature, latlng) {
                    //     return L.circleMarker(latlng, stationStyle);
                    // }
                    pointToLayer: function (feature, latlng){
                        // return L.circleMarker(latlng, pointMarkerStyle);
                        myIcon = L.divIcon({
                            className: 'label',
                            html: '<i class="fa fa-subway" style="font-size: 1.5em; color: #5c5c5c;" aria-hidden="true"></i>',
                        });
                        return L.marker(latlng, {icon: myIcon});
                    }
                }).addTo(map);



                //Plot path
                var lineStyle = {
                    "color": "#0085ff",
                    "weight": 5,
                    "opacity": 0.65
                };

                L.geoJSON($scope.line, {
                    style: lineStyle
                }).addTo(map);
            });
        };

        //Gets current map object
        leafletData.getMap('map').then(function(map) {
            // Tries to get user current location and will 'watch' and 'follow' (request every 20 seconds and shift map view to follow user)
            map.locate({
                watch: true,
                setView: false,
                timeout: 3000,
                maximumAge: 20000,
                enableHighAccuracy: true
            });

            //If user location found, check to see if user has reached the next point in the route
            //Every 20 seconds
            map.on('locationfound', function (e) {
                console.log(e.latlng, e.accuracy);
                $scope.step_by_step = $scope.instructions_check[0];
                $scope.time_left = parseInt($scope.dist_to_dest_check[0]/270);

                ///Takes array of route points and removes one each time the user reaches it
                var tolerance = 0.000137;
                if ($scope.point_route_check) {
                    //If only one point remaining in route
                    if ($scope.point_route_check.length === 1){
                        //If user is close to remaining point in route, then they have arrived
                        if (((e.latlng.lat - $scope.next_point.latitude) < tolerance) && ((e.latlng.lng - $scope.next_point.longitude) < tolerance)){
                            //Sets page to arrived state
                            $scope.arrived = true;
                        }
                    }
                    //If there are remaining steps in route (>1)
                    else if ($scope.point_route_check.length > 1){
                        //Current point is first point in route points array
                        $scope.current_point = $scope.point_route_check[0];
                        $scope.next_point = $scope.point_route_check[1];
                        //If user is close to the next point in the array
                        if (((e.latlng.lat - $scope.next_point.latitude) < tolerance) && ((e.latlng.lng - $scope.next_point.longitude) < tolerance)){
                            //Get instructions for current route point
                            $scope.step_by_step = $scope.instructions_check[0];
                            //Get distance remaining for current route point (convert to time)
                            $scope.time_left = parseInt($scope.dist_to_dest_check[0]/270);
                            //Remove current point, its instructions, and its dist from route arrays
                            $scope.instructions_check.splice(0,1);
                            $scope.point_route_check.splice(0,1);
                            $scope.dist_to_dest_check.splice(0,1);
                        }
                    }
                } else {

                }
            });
        });


    };

    //Called when user EXITs navigation - resets page view, removes map layers, re-adds tilelayer to map.
    $scope.stopNav = function (){
        $scope.navigating = false;
        leafletData.getMap('map').then(function(map) {
            map.eachLayer(function(layer){
                map.removeLayer(layer);
            });
            L.tileLayer(basemap, {maxZoom:20}).addTo(map);
        });
        $scope.query = '';
        $scope.show_results = false;
        $scope.show_all_steps = false;
        $scope.arrived = false;
    };
});

app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state({
            name: 'home',
            url: '/home',
            templateUrl: 'map.html',
            controller: 'NavController'
        });
    $urlRouterProvider.otherwise('/home');
});
