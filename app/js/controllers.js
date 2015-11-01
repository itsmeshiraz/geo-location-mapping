'use strict';
/*
http://localhost:8000/app/index.html#/dashboard
*/
/* Controllers */

var phonecatControllers = angular.module('phonecatControllers', []);

phonecatControllers.controller('PhoneListCtrl', ['$scope', 'Phone',
  function($scope, Phone) {
    $scope.phones = Phone.query();
    $scope.orderProp = 'age';
  }]);

phonecatControllers.controller('PhoneDetailCtrl', ['$scope', '$routeParams', 'Phone',
  function($scope, $routeParams, Phone) {
    $scope.phone = Phone.get({phoneId: $routeParams.phoneId}, function(phone) {
      $scope.mainImageUrl = phone.images[0];
    });

    $scope.setImage = function(imageUrl) {
      $scope.mainImageUrl = imageUrl;
    };
    //Add google map to the scope
    $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };
  }]);

  /*
  Dashboard controller will be responsible for /dashboard page (route).
  */
  phonecatControllers.controller("dashboardCtrl", ['$scope', 'elasticsearchClient', 'geohash',
    function($scope, elasticsearchClient, geohash){
      elasticsearchClient.ping({
        requestTimeout: 30000,
        // undocumented params are appended to the query string
        hello: "elasticsearch"
      }, function (error) {
        if (error) {
          console.error('elasticsearch cluster is down!');
          $scope.esStatus = 'elasticsearch cluster is down!';
        } else {
          console.log('All is well');
          $scope.esStatus= 'Connected to elasticsearch cluster';
        }
      });

      var runQuery = function(){
        console.log("inside runQuery");
        var googleMapZoomToElasticSearchPrecisionMap = {1 : 1, 2: 1, 3: 1,
          4: 2, 5: 3, 6:3, 7:3, 8:4, 9:4, 10:5, 11:5, 12:6, 13:6, 14:7, 15:8,
          20: 9, 19: 10, 18: 11, 17:12, 16: 12};

            var GMap = $scope.map.control.getGMap();
            var mapBounds = GMap.getBounds();
            var bottom_right = GMap.getBounds().getSouthWest();
            var top_left = GMap.getBounds().getNorthEast();
            $scope.bottom_right = bottom_right;
            $scope.top_left = top_left;

            var elasticsearchPrecision = googleMapZoomToElasticSearchPrecisionMap[GMap.getZoom()];
                  $scope.zoom = GMap.getZoom();
                  $scope.elasticsearchPrecision = elasticsearchPrecision;
            elasticsearchClient.search({
              index: 'analytics',
              type: 'userSession',
              body: {
                aggs: {
                    testgeoHashing :{
                        geohash_grid : {
                            field: 'location',
                            'precision': elasticsearchPrecision
                        },
                    aggs:{
                      cell: {
                        geo_bounds: {
                          field: 'location'
                        }
                      }
                    }
                  }
                }
              }
          }).then(function (body) {
            $scope.queryResult = body;
            consumeElasticsearchDataAndUpdateMap(body);
            var hits = body.hits.hits;
          }, function (error) {
            console.trace(error.message);
          });

          /*
          * This method will take the result of elastic search query and update the google map.
          */
          var consumeElasticsearchDataAndUpdateMap = function(data){
            var polygons = [];

            //Clear any existing rectangles
            while($scope.rectangles[0]){
              $scope.rectangles.pop().setMap(null);
            }
            for(var i=0; i < data.aggregations.testgeoHashing.buckets.length; i++) {
              var bucket = data.aggregations.testgeoHashing.buckets[i];
              var bounds = bucket.cell.bounds;
            var decodedHash = geohash.decode_bbox(bucket.key);
            console.log(geohash.decode_bbox(bucket.key));
            var rectangle = new google.maps.Rectangle({
                                strokeColor: '#FF0000',
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                fillColor: '#FF0000',
                                fillOpacity: 0.35,
                                map: $scope.map.control.getGMap(),
                                bounds: new google.maps.LatLngBounds(
                                  new google.maps.LatLng(decodedHash[0], decodedHash[1]),
                                  new google.maps.LatLng(decodedHash[2], decodedHash[3]))
                              });
                              $scope.rectangles.push(rectangle);
}


          }

          };
      //Add google map to the scope
      $scope.map = {
            center: [40.52, 34.34],
            zoom: 1,
            bounds: {},
            control: {},
            events: {
              dragend: runQuery,
              zoom_changed: runQuery
            },
            markers: [],
            polygons: [],
            lastQuery: null
          };
     $scope.rectangles = [];
    }

]);
