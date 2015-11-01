'use strict';

/* Services */

var phonecatServices = angular.module('phonecatServices', ['ngResource']);

phonecatServices.factory('Phone', ['$resource',
  function($resource){
    return $resource('phones/:phoneId.json', {}, {
      query: {method:'GET', params:{phoneId:'phones'}, isArray:true}
    });
  }]);


  /*
   * create a service, which provides your elasticsearch client
   * to other parts of your application
   */
   phonecatServices.service('elasticsearchClient', function (esFactory) {
     return esFactory({
       host: 'localhost:9200',
       log: 'trace'
       // ...
     });
   });
