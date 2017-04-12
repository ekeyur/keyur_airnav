from flask import Flask, request, jsonify
# from all_s_paths import all_paths
# from dotenv import load_dotenv, find_dotenv
import heapq
import os,io
import sys
import json
import csv
import copy


# load_dotenv(find_dotenv())
base_dir = os.path.dirname(os.path.abspath(__file__))
# static_dir = os.path.join(base_dir, 'static')
# app = Flask('Connect', static_url_path='', static_folder=static_dir)
# app = Flask('Connect', template_folder=tmp_dir)

# tmp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)),'templates')
static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)),'static')
app = Flask('Connect',static_url_path='',static_folder=static_folder)

# with open('points.json') as ts:
#     tk = json.load(ts)
#
# initial_pointsJSON = tk


with open(base_dir + '/points.json') as json_file:
   pointsJSON = json.load(json_file)

# with open('points.json') as json_file:
#    pointsJSON = json.load(json_file)
# app = Flask('Connect', static_url_path='')


def add2way_vertex(origin,destination,distance):
    g.add_vertex(str(origin),{str(destination):distance})
    g.add_vertex(str(destination),{str(origin):distance})


class Graph:

    def __init__(self):
       self.vertices = {}


    def add_vertex(self, name, edges):

        if name in self.vertices:
           self.vertices[name].update(edges)
        else:
           self.vertices[name] = edges

    def get_distance(self,origin,destination):
        return self.vertices[origin][destination]

    def shortest_path(self, start, finish):
        distances = {} # Distance from start to node
        previous = {}  # Previous node in optimal path from source
        nodes = [] # Priority queue of all nodes in Graph

        for vertex in self.vertices:
            if vertex == start: # Set root node as distance of 0
               distances[vertex] = 0
               heapq.heappush(nodes, [0, vertex])
            else:
               distances[vertex] = sys.maxsize
               heapq.heappush(nodes, [sys.maxsize, vertex])
            previous[vertex] = None

        while nodes:
            smallest = heapq.heappop(nodes)[1] # Vertex in nodes with smallest distance in distances
            if smallest == finish: # If the closest node is our target we're done so print the path
                path = []
                while previous[smallest]: # Traverse through nodes til we reach the root which is 0
                   path.append(smallest)
                   smallest = previous[smallest]
                return path
            if distances[smallest] == sys.maxsize: # All remaining vertices are inaccessible from source
               break

            for neighbor in self.vertices[smallest]: # Look at all the nodes that this vertex is attached to
                alt = distances[smallest] + self.vertices[smallest][neighbor] # Alternative path distance
                if alt < distances[neighbor]: # If there is a new shortest path update our priority queue (relax)
                    distances[neighbor] = alt
                    previous[neighbor] = smallest
                    for n in nodes:
                        if n[1] == neighbor:
                           n[0] = alt
                           break
                    heapq.heapify(nodes)
        return None

    def __str__(self):
       return str(self.vertices)

# if __name__ == '__main__':
g = Graph()


initial_pointsJSON = copy.deepcopy(pointsJSON);
# print "initial  ",initial_pointsJSON[0]["id"]

class Point:
    def __init__(self):
        self.point = {}

    def addPoint(self,ide,concourse,name,latitude,longitude,poi_type):
        self.point['id'] = ide
        self.point['concourse']=concourse
        self.point['name'] = name
        self.point['latitude'] = latitude
        self.point['longitude'] = longitude
        self.point['poi_type'] = poi_type



concourses = [{'name':'T', 'longitude':'-84.442447'},
              {'name':'A', 'longitude':'-84.439175'},
              {'name':'B', 'longitude':'-84.435897'},
              {'name':'C', 'longitude':'-84.432600'},
              {'name':'D', 'longitude':'-84.429307'},
              {'name':'E', 'longitude':'-84.425720'},
              {'name':'F', 'longitude':'-84.419815'}
]


E_horizontal = ["E14","E15","E16","E17","E18"]
json_len = len(pointsJSON)
point_id = 2000
# Loop through each gate in E_terminal_horizontal_gates
for epoint in E_horizontal:
    for i in range(0,json_len):
        if epoint == pointsJSON[i]['name']:
            p = Point()
            p.addPoint(str(point_id),"E",epoint,"33.640631",pointsJSON[i]['longitude'],"hcenter")
            pointsJSON.append(p.point)
            add2way_vertex(str(point_id),pointsJSON[i]['id'],45)
            point_id += 1
json_len = len(pointsJSON)
point_id = 5000

# Code for adding vertical center points
for concourse in concourses:
    # // For each initial JSON point (from OpenStreetMap)
    for i in range (0, json_len):

        # // Only look at points (gates) in the current concourse
            # // Create new JSON point that connects JSON point (gate) to concourse centerline
        if pointsJSON[i]['concourse'] == concourse['name']:
            # bool1 = pointsJSON[i]['name'][1:] in E_horizontal
            bool2 = pointsJSON[i]['name'] in E_horizontal
            if (not bool2):
                if (not pointsJSON[i]['poi_type'] == 'train'): # excluding the train terminal gates
                    gate = pointsJSON[i]
                    p = Point()
                    p.addPoint(str(point_id),gate['concourse'],concourse['name']+ gate['name'],gate['latitude'],concourse['longitude'],'center');
                    pointsJSON.append(p.point)
            add2way_vertex(pointsJSON[i]['id'],str(point_id),46)
            point_id += 1


json_len = len(pointsJSON)
for concourse in concourses:
    # // Create empty structures
    concoursePoints = [];  #// stores names of all points in current concourse
    pointsSorted = {}; #// all points in current concourse sorted by latitude
    #// For each JSON point
    for i in range(0,json_len):
        #// If JSON point is in current concourse:
        # All the other
        if(pointsJSON[i]['concourse'] == concourse['name']):
            concoursePoints.append(pointsJSON[i])
    #// Sorting points for current concourse by latitude
    pointsSorted = sorted(concoursePoints,key=lambda k:k['latitude'])

    #// Create empty array for center line points
    midpoint_arr = []
    for point in pointsSorted:
        if(point['longitude'] == concourse['longitude']):
            midpoint_arr.append(point)

    #// For each center line point
    for i in range(0,len(midpoint_arr)-1):
        #// Getting latitude distance between points and converting to distance for edge definition
        dist = (float(midpoint_arr[i+1]['latitude']) - float(midpoint_arr[i]['latitude'])) * 363917.7912
        add2way_vertex(midpoint_arr[i]['id'],midpoint_arr[i+1]['id'],round(dist,2))

# If the midpoint belongs to horizontal gates in E terminal, connect the horizontal line
#---------------------------------- This is the code to connect the horizontal line in E terminal
concoursePointsEH =[]
pointsSortedEH = []
for i in range(0,json_len):
    if(pointsJSON[i]['latitude'] == '33.640631'):
        concoursePointsEH.append(pointsJSON[i])
#sort the arry of points by
pointsSortedEH = sorted(concoursePointsEH,key=lambda k:k['longitude'])

for t in range(0,len(pointsSortedEH)-1):
    dist1 = abs(float(pointsSortedEH[t+1]['longitude']) - float(pointsSortedEH[t]['longitude'])) * 363917.7912
    add2way_vertex(pointsSortedEH[t]['id'],pointsSortedEH[t+1]['id'],round(dist1,2))

#----------------------------------------
terminal_distance = 100
escalator_train_d = 5



#adding a two way vertex to connect E_horizontal with E Vertical line in the center.
add2way_vertex('2170','6795',terminal_distance)

add2way_vertex('294','295',terminal_distance)
add2way_vertex('296','295',terminal_distance)

# Terminal vertexes
g.add_vertex('297',{'285':escalator_train_d})
g.add_vertex('286',{'298':escalator_train_d})

#f & e stations
g.add_vertex('306',{'307':escalator_train_d})
g.add_vertex('307',{'308':escalator_train_d})

add2way_vertex('286','298',escalator_train_d)
add2way_vertex('300','301',escalator_train_d)
add2way_vertex('287','299',escalator_train_d)
add2way_vertex('288','300',escalator_train_d)
add2way_vertex('289','301',escalator_train_d)
add2way_vertex('290','302',escalator_train_d)
add2way_vertex('291','303',escalator_train_d)
add2way_vertex('292','304',escalator_train_d)
add2way_vertex('293','305',escalator_train_d)
add2way_vertex('294','306',escalator_train_d)
add2way_vertex('295','307',escalator_train_d)
add2way_vertex('296','308',escalator_train_d)
# Vertices for baggage claim and t terminal
g.add_vertex('298',{'297':terminal_distance})

add2way_vertex('298','299',terminal_distance)
add2way_vertex('300','301',terminal_distance)
add2way_vertex('302','303',terminal_distance)
add2way_vertex('304','305',terminal_distance)

add2way_vertex('299','300',50)
add2way_vertex('301','302',50)
add2way_vertex('303','304',50)
add2way_vertex('305','306',50)


g.add_vertex('285',{})

# print g


#------------------
#all shortest paths
s_path_dict = {}
def all_s_paths(poi):
    l = len(poi)
    for i in range(0,l):
        print i
        for j in range(1,l):
            if i == j:
                pass
            else:
                temp_arr = g.shortest_path(poi[i]['id'],poi[j]['id'])
                if (temp_arr):
                    temp_arr.reverse()
                    dist_sum = 0
                    for k in range(0,len(temp_arr)-1):
                        dist_sum += g.get_distance(temp_arr[k],temp_arr[k+1])
                    s_path_dict[str(poi[i]['id'])+"-"+str(poi[j]['id'])+"-dist"] = dist_sum
                    s_path_dict[str(poi[i]['id'])+"-"+str(poi[j]['id'])+"-route"] = temp_arr
#     # --------------------
# uncomment this code to remake the dictionary of all the points
#-----------------------------------
# all_s_paths(initial_pointsJSON)
# with open('all_s_paths.json', 'w') as f:
#     json.dump(s_path_dict, f)
# -----------------------


@app.route('/')
def home():
    return app.send_static_file('index.html')

# route that returns the shortest_path array


@app.route('/shortest_path')
def shortest_Path():

    # origin = '2'
    # destination = '221'
    origin = request.args.get('origin')
    destination = request.args.get('destination')
    # print g.get_distance('5288','5290')
#--------------------------------------------
    route_dict = {}
    instructions = []
    points_only = g.shortest_path(origin,destination)

    points_only.append(origin)
    points_only.reverse()
    points = []

#----------------------------------------

    #distance to destination as we move along the path
    d_sum=0
    dist_to_dest = []
    for j in range(0,len(points_only)-1):
        d_sum += g.get_distance(points_only[j],points_only[j+1])
        dist_to_dest.append(d_sum)
    dist_to_dest.reverse()

    # print points_only
    for i in range(0,len(points_only)):
        for point in pointsJSON:
            if(point['id'] == points_only[i]):
                points.append({points_only[i]:{"latitude":point['latitude'],"longitude":point['longitude'],"poi_type":point['poi_type'],"concourse": point['concourse'],"name":point['name']}})

    for i in range(0,len(points)-1):
        v = points[i].values()[0]
        v1 = points[i+1].values()[0]
        # v2 = points[i+2].values()[0]
        if v['poi_type'] == "gate" or v1['poi_type'] == "gate" or v['poi_type'] == "center" or v1['poi_type'] == "center":
            if ((float(v['latitude']) == float(v1['latitude'])) and (float(v['longitude']) < float(v1['longitude']))):
                instructions.append("Continue Forward East")
                # instructions.append("Continue Forward 3")
            elif ((float(v['latitude']) == float(v1['latitude'])) and (float(v['longitude']) > float(v1['longitude']))):
                instructions.append("Continue Forward West")
                # instructions.append("Continue Forward 9")
            elif ((float(v['longitude']) == float(v1['longitude'])) and (float(v['latitude']) < float(v1['latitude']))):
                # instructions.append("Continue Forward 12")
                instructions.append("Continue Forward North")
            elif ((float(v['longitude']) == float(v1['longitude'])) and (float(v['latitude']) > float(v1['latitude']))):
                instructions.append("Continue Forward South")
                # instructions.append("Continue Forward 6")

        if v1["poi_type"] == "escalator":
            if "Go down the escalator" in instructions:
                instructions.append("Go up the escalator")
            else:
                instructions.append("Go down the escalator")

        if v["poi_type"] == "train":
            if "Get on the train" in instructions:
                if v1["poi_type"] == "escalator":
                    instructions.append("Get off the train")
                else:
                    instructions.append("Stay on the train")
            else:
                instructions.append("Get on the train")

    # print dist_to_dest
    route_final = {
                   'points': points,
                   'instructions': instructions,
                   'dist_to_dest': dist_to_dest
                   }
    return jsonify(route_final)

#route that returns all the points in the airport
@app.route('/all_points')
def all_points():
    return jsonify(pointsJSON);

all_paths_dict = {}
all_dist_dict = {}

#route that returns points that are searched by names
@app.route('/search')
def search():
    search = request.args.get('query').lower()
    search_origin = request.args.get('origin_id')
    # print search
    # print request.args.get('origin_id')
    # search_origin = '221'
    search_points = []
    search_route = []
    if len(search) > 1:
        for i in range(0,len(pointsJSON)):
           # print 'ID: ' + pointsJSON[i]['id']
            if search in pointsJSON[i]['name'].lower() and pointsJSON[i]['poi_type'] != "center" and pointsJSON[i]['poi_type'] != "hcenter" and pointsJSON[i]['poi_type'] != "train" and pointsJSON[i]['poi_type'] != "escalator":

                search_string = search_origin+"-"+pointsJSON[i]['id']+"-"+"route"

                search_route = g.shortest_path(search_origin,pointsJSON[i]['id'])


                # if search_string in all_paths_dict:
                #     search_route = all_paths_dict[search_string]
                # else:
                #     search_route = g.shortest_path(search_origin,pointsJSON[i]['id'])
                #     all_paths_dict[search_string] = search_route

                # print (all_paths["301-299-route"])

                # search_route = all_s_paths[search_string]


                # search_route = all_s_paths[]
                # print search_route
                if search_route:
                    search_route.append(search_origin)
                    dist_sum = 0
                    # print search_route
                    for j in range(0,len(search_route)-1):
                        # print search_route[j]
                        dist_sum += g.get_distance(search_route[j+1],search_route[j])
                    time = round(dist_sum/270,2)
                    # print dist_sum
                    temp_point = pointsJSON[i]
                    temp_point['time'] = time
                    temp_point['s_index'] = pointsJSON[i]['name'].lower().index(search)
                    search_points.append(temp_point)
        # print search_points
        return jsonify(search_points)
    # elif len(search) > 0 and len(search) < 3:
    #     for i in range(0,len(pointsJSON)):
    #        # print 'ID: ' + pointsJSON[i]['id']
    #         if search in pointsJSON[i]['name'].lower() and pointsJSON[i]['poi_type'] == "gate":
    #             search_route = g.shortest_path(search_origin,pointsJSON[i]['id'])
    #             # print search_route
    #             if search_route:
    #                 search_route.append(search_origin)
    #                 dist_sum = 0
    #                 for j in range(0,len(search_route)-1):
    #                     dist_sum += g.get_distance(search_route[j+1],search_route[j])
    #                 time = round(dist_sum/270,2)
    #                 # print dist_sum
    #                 temp_point = pointsJSON[i]
    #                 temp_point['time'] = time
    #                 temp_point['s_index'] = pointsJSON[i]['name'].lower().index(search)
    #                 search_points.append(temp_point)
    #     # print search_points
    #     return jsonify(search_points)

if __name__ == '__main__':
	app.run()
