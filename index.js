"use strict";
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(express.static('static'));
app.use(bodyParser.json());


var poi = require('./points.json');
var train_stations = require('./train_stations');

var g = new Graph();

var concourses = [
                {'name':'T', 'longitude':'-84.442447'},
                {'name':'A', 'longitude':'-84.439175'},
                {'name':'B', 'longitude':'-84.435897'},
                {'name':'C', 'longitude':'-84.432600'},
                {'name':'D', 'longitude':'-84.429307'},
                {'name':'E', 'longitude':'-84.425720'},
                {'name':'F', 'longitude':'-84.419815'}
                  ];

var E_terminal_horizontal_gates = [];

var E_terminal_horizontal_gates = ["E14","E15","E16","E17","E18"];


// Cloning the origin points array
var clone = JSON.parse( JSON.stringify(poi));

// Function to add a 2 way node
function add2WayNode(pointA,pointB,distance){
  g.addVertex(pointA,{[pointB] : distance});
  g.addVertex(pointB,{[pointA] : distance});
}

// Define a point
function Point(id,name,type,concourse,latitude,longitude){
  this.id = id;
  this.name = name;
  this.poi_type = type;
  this.concourse = concourse;
  this.latitude = latitude;
  this.longitude = longitude;
}

////////////////////////////////////////////////////////////////
//// Add center points in E Terminal for horizontal path////
///////////////////////////////////////////////////////////////

var point_id = 2000;
// Loop through each gate in E_terminal_horizontal_gates
E_terminal_horizontal_gates.forEach(function(egate){
  //Loop through all the points in points.json
  for(let i=0;i<clone.length;i++){
  // If the gate cotains in points.json
    if(egate === clone[i].name){
      // Make a dummy point for a center horizontal line for each gate in horizontal
      let dummy_horizonal_point = new Point(point_id.toString(),egate,"hcenter","E","33.640631",clone[i].longitude);
      // Add the point to all the points array
      poi.push(dummy_horizonal_point);
      //Add a two way node between the newly generated point and the Horizontal Gate Point on E Terminal.
      add2WayNode(point_id.toString(),clone[i].id,45);
    }
    // Increment the point_ids
    point_id++;
  }

});
// Set the point_id to a greater number
point_id = 5000;

////////////////////////////////////////////////////////////////
//// Add center points in each concourse for vertical paths////
///////////////////////////////////////////////////////////////

// Loop through each concourse
concourses.forEach(function(concourse){
  // Loop through each gate/restaurat point
  for(let i=0;i<clone.length;i++){
    // If the point exist in the horizontal part of E terminal, then bool1 will be true skip it.
    let bool1 = E_terminal_horizontal_gates.includes(clone[i].name)
    // Skip, if the point_type = 'train';
    let bool2 = clone[i].poi_type === 'train';
    // Checking if the concourse name in points array is same as the concourse name in concourses database & previous two steps
      if(clone[i].concourse === concourse.name && !bool1 && !bool2){
        // Create a point with using the Point class/function
        let dummy_vertical_point = new Point(point_id.toString(),concourse.name+clone[i].name,"vcenter",clone[i].concourse,clone[i].latitude,concourse.longitude);
        // push the point in the poi database
        poi.push(dummy_vertical_point);
        // add a two way node between the newly created point and a gate/restaurat point in the graph.
        add2WayNode(point_id.toString(),clone[i].id.toString(),46)
      }
      // Incrementing the point
      point_id += 1;
    }

});

// Cloning the array again
var clone2 = JSON.parse( JSON.stringify(poi));

//////////////////////////////////////////////////////////////////////////////////////////
////Connect all the vertical center points in each terminal together to make a path  ////
////////////////////////////////////////////////////////////////////////////////////////

concourses.forEach(function(concourse){
  // Created an empty array to store all the points of the current concourse
  let concoursePoints = [];
  let concoursePointsEH = [];

  // For each airport/restaurat/mid point
  for(let i=0;i<clone2.length;i++){
    //If
    if(clone2[i].concourse === concourse.name){
      //Push the point in concoursePoints
      concoursePoints.push(clone2[i]);
    }

  }
  // Sort all the points by latitute
  var sortedPoints = concoursePoints.sort(function(a,b){
    return a.latitude - b.latitude;
  });


  // Create an empty array for center line points
  let midpoints_arr = [];
  //Loop over each sorted point in the array
  sortedPoints.forEach(function(sortedPoint){
    // If the sorted point is in the current terminal
    if(sortedPoint.longitude === concourse.longitude){
      // Pushing the point to midpoints_arr
      midpoints_arr.push(sortedPoint);
    }
  });

  // Here I am going to connect each of the center points with 2 way nodes
  // using the difference between longitudes and multiplying by a factor
  for (let i=0; i < midpoints_arr.length-1;i++){
    let distance = (midpoints_arr[i+1].latitude - midpoints_arr[i].latitude) * 363917.7912;
    add2WayNode(midpoints_arr[i+1].id,midpoints_arr[i].id,distance);
  }
});

//////////////////////////////////////////////////////////////////////////////////////////
////Connect all the horizontal center points in E terminal together to make a path   ////
////////////////////////////////////////////////////////////////////////////////////////
// All points in current concourse by latitude


var concoursePointsEH = [];

for(let i=0;i<clone2.length;i++){
  // Check if the point belongs to horizontal line in E terminal
  if(clone2[i].latitude === '33.640631'){
    // Push it in different array
    concoursePointsEH.push(clone2[i]);
  }
}

// Sort the horizontal points in E Terminal
var sortedPointsEH = concoursePointsEH.sort(function(a,b){
  return a.longitude - b.longitude;
});

for(let i=0;i<sortedPointsEH.length-1;i++){
  var distance = (sortedPointsEH[i+1].longitude - sortedPointsEH[i].longitude) * 363917.7912;
    distance = Math.round(distance);
  add2WayNode(sortedPointsEH[i+1].id,sortedPointsEH[i].id,distance);
}

var terminal_distance = 100;
var escalator_train_d = 5;

// adding a two way vertex to connect E_horizontal with E Vertical line in the center.
add2WayNode('2170','6795',terminal_distance);

add2WayNode('294','295',terminal_distance);
add2WayNode('296','295',terminal_distance);


// # Terminal vertexes
g.addVertex('297',{'285':escalator_train_d});
g.addVertex('286',{'298':escalator_train_d});

// #f & e stations

g.addVertex('306',{'307' : escalator_train_d});
g.addVertex('307',{'308' : escalator_train_d});

add2WayNode('286','298',escalator_train_d);
add2WayNode('300','301',escalator_train_d);
add2WayNode('287','299',escalator_train_d);
add2WayNode('288','300',escalator_train_d);
add2WayNode('289','301',escalator_train_d);
add2WayNode('290','302',escalator_train_d);
add2WayNode('291','303',escalator_train_d);
add2WayNode('292','304',escalator_train_d);
add2WayNode('294','306',escalator_train_d);
add2WayNode('295','307',escalator_train_d);
add2WayNode('296','308',escalator_train_d);
// # Vertices for baggage claim and t terminal
g.addVertex('298',{'297':terminal_distance});

add2WayNode('298','299',terminal_distance);
add2WayNode('300','301',terminal_distance);
add2WayNode('302','303',terminal_distance);
add2WayNode('304','305',terminal_distance);

add2WayNode('299','300',50);
add2WayNode('301','302',50);
add2WayNode('303','304',50);
add2WayNode('305','306',50);
g.addVertex('285',{'297' : 5});


// All Points Get Route
app.get('/all_points',function(request,response){
  response.json(poi);
});

// Search Route for the App


app.get('/search',function(request,response){
  var search = request.query.query.toLowerCase();
  var search_origin = request.query.origin_id.toLowerCase();
  var search_points = [];
  if(search.length >= 2){
    poi.forEach(function(point){
      if (search === point.name.toLowerCase() && point.poi_type !== "center" && point.poi_type !== "hcenter" && point.poi_type !== "train" && point.poi_type !== "escalator") {
        var search_route = g.shortestPath(search_origin,point.id);
        if(search_route){
          var dist_sum = 0;
          for(var i=0;i<search_route.length;i++){
            dist_sum += g.getDistance(search_route[i],search_route[i+1]);
          }
          var time = Math.round(dist_sum/270.2);
          var temp_point = point;
          temp_point.time = time;
          temp_point.s_index = point.name.toLowerCase().indexOf(search);
          search_points.push(temp_point);
        }
      }
    });
    response.json(search_points);
  }



});


console.log(g.shortestPath('8','121'));



app.listen(3000,function(){
  console.log("It's Showtime");
});


///////////////////////Dijkstra's Algorithm////////////////////////////

function PriorityQueue () {
  this._nodes = [];

  this.enqueue = function (priority, key) {
    this._nodes.push({key: key, priority: priority });
    this.sort();
  };
  this.dequeue = function () {
    return this._nodes.shift().key;
  };
  this.sort = function () {
    this._nodes.sort(function (a, b) {
      return a.priority - b.priority;
    });
  };
  this.isEmpty = function () {
    return !this._nodes.length;
  };
}

/**
 * Pathfinding starts here
 */
function Graph(){

  var INFINITY = 1/0;
  this.vertices = {};

  this.getDistance = function(start,finish){
    return this.vertices[start][finish];
  };

  this.addVertex = function(name, edges){
    if (name in this.vertices){
      Object.assign(this.vertices[name],edges);
    }else{
      this.vertices[name] = edges;
    }
  };

  this.shortestPath = function (start, finish) {
    var nodes = new PriorityQueue(),
        distances = {},
        previous = {},
        path = [],
        smallest, vertex, neighbor, alt;

    for(vertex in this.vertices) {
      if(vertex === start) {
        distances[vertex] = 0;
        nodes.enqueue(0, vertex);
      }
      else {
        distances[vertex] = INFINITY;
        nodes.enqueue(INFINITY, vertex);
      }

      previous[vertex] = null;
    }

    while(!nodes.isEmpty()) {
      smallest = nodes.dequeue();

      if(smallest === finish) {
        path = [];
        while(previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }
        break;
      }

      if(!smallest || distances[smallest] === INFINITY){
        continue;
      }

      for(neighbor in this.vertices[smallest]) {
        alt = distances[smallest] + this.vertices[smallest][neighbor];

        if(alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = smallest;

          nodes.enqueue(alt, neighbor);
        }
      }
    }
    // Adding the start to the path
    path.push(start);
    // reversing the array
    path.reverse();
    return path;
  };
}
