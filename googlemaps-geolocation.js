RnumberToRadius = function(number) {
  return number * Math.PI / 180;
};

RpointDistance= function(pt1, pt2) {
  var lon1 = pt1.coordinates[0],
    lat1 = pt1.coordinates[1],
    lon2 = pt2.coordinates[0],
    lat2 = pt2.coordinates[1],
    dLat = RnumberToRadius(lat2 - lat1),
    dLon = RnumberToRadius(lon2 - lon1),
    a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(RnumberToRadius(lat1))
      * Math.cos(RnumberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2),
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (6371 * c) * 1000; // returns meters
};

Toilets = new Mongo.Collection('toilets');

if (Meteor.isServer){



  Meteor.startup(function () {

     if (Toilets.find().count() === 0) {

      console.log("toilets empty");

      var data = JSON.parse(Assets.getText("Toilet.geojson"));

      console.log(data.features[0]);

      data.features.forEach(function (item, index, array) {
            Toilets.insert(item);
        })


    }

    //console.log(Toilets.find().count());
    //console.log(Toilets[10]);


    Meteor.methods({
      getGeo: function (lat, lng) {
      var geo = new GeoCoder({
        geocoderProvider: "google",
        httpAdapter: "https",
        apiKey: 'AIzaSyCnJcaL66pbshFFBkdUgUUCZOeFyp2H3Ew'
      });

      var result = geo.reverse(lat, lng);

      console.log(result[0].formattedAddress);
      
      return result;//"53 Hereford St";
      },

      

      findNearest: function(lat, lng) {

      

      //console.log(Toilets.find().fetch());

      var sourceP = "+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ";
      var destinP = proj4("WGS84") ;

      var pd_old = 100000;
      var closest = 100000;
      var new_coords = [100,100];
      var dist = 100;

      var deta = Toilets.find().fetch();
      //console.log(deta[10].geometry.coordinates[0]);

      for (var i in Toilets.find().fetch()) {
        //console.log(i);
        //console.log([lng, lat]);
        //console.log(deta[i].geometry.coordinates[0][1]);

        //console.log(Toilets.find().fetch().count());
        var Toilet_coords = proj4(sourceP,destinP, deta[i].geometry.coordinates[0][0]);

        var pd = 0;
        var pd = RpointDistance({type: 'Point', coordinates:[lng, lat]}, //wgs84
                  {type: 'Point', coordinates:Toilet_coords}) //
        //console.log(pd);
        if (pd < pd_old) {

          pd_old = pd;
          closest = i;
          new_coords = Toilet_coords;
          dist = pd;
          
        }
      }


     // var source = new Proj4js.Proj("EPSG:4326");    //source coordinates will be in Longitude/Latitude
      //var dest = new Proj4js.Proj("EPSG:27563");


      console.log("return");
      return dist;


      //console.log(sourceP);
      //console.log(destinP);
      //console.log(deta[i].geometry.coordinates[0][0]);

      //console.log(proj4(sourceP,destinP, Toilets.find().fetch()[119].geometry.coordinates[0][0]));
      //proj4(fromProjection[, toProjection2, deta[i].geometry.coordinates[0]])

      //console.log(pd_old);
      //console.log(closest);

      },

      welcome: function (name) {
      console.log('on server, welcome called with name: ', name);
      if(name==undefined || name.length<=0) {
          throw new Meteor.Error(404, "Please enter your name");
      }
        return "Welcome " + name;
      }
    });
  });

}

if (Meteor.isClient) {
  var MAP_ZOOM = 15;

  Meteor.startup(function() {
    GoogleMaps.load({ v: '3', key: 'AIzaSyC-dZkkReps0qOuUSSYsJ5PNCYG054tdJI', libraries: 'geometry,places' });
  });

  Template.interface.helpers({
    currentLocation: function(){



    if (Geolocation.latLng()){
      var location = [Geolocation.latLng().lat, Geolocation.latLng().lng];
      var loc ;

      Meteor.call('getGeo',location[0], location[1], function(err, response) {
          loc = response;
          Session.set('loci', response[0].formattedAddress);
          console.log(Session.get('loci'));
      });

console.log(loc);

    speechSynthesis.speak(new SpeechSynthesisUtterance("Your current locations is"));
    speechSynthesis.speak(new SpeechSynthesisUtterance(Session.get('loci')));

    Meteor.call('findNearest',location[0], location[1], function(err, response) {
          //loc = response;
          //Session.set('loci', response[0].formattedAddress);
          console.log(response);
          Session.set('dest', response);
      });

console.log("here");
    console.log(Session.get('dest'));



    speechSynthesis.speak(new SpeechSynthesisUtterance("The nearest toilet is"));
    speechSynthesis.speak(new SpeechSynthesisUtterance(Session.get('dist')));
    speechSynthesis.speak(new SpeechSynthesisUtterance("311"));
    speechSynthesis.speak(new SpeechSynthesisUtterance("meters away"));
 

    /*var marker = new google.maps.Marker({
      position: new google.maps.LatLng(Session.get('dest')[1], Session.get('dest')[0]),
      map: GoogleMaps.maps.instance
    });*/

    console.log(marker);

     // var loc = GoogleMaps.Geocode(location);
      //GeocoderRequest(Geolocation.latLng());//"ha";//Geocoder(GeocoderRequest(Geolocation.latLng()));
      //GeocoderAddressComponent();
      return Session.get('loci');
    }
    else{
      return;
    }
    }
  })

  Template.map.onCreated(function() {
    var self = this;

    GoogleMaps.ready('map', function(map) {
      var marker;

      // Create and move the marker when latLng changes.
      self.autorun(function() {
        var latLng = Geolocation.latLng();
        if (! latLng)
          return;

        // If the marker doesn't yet exist, create it.
        if (! marker) {
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(latLng.lat, latLng.lng),
            map: map.instance
          });
        }
        // The marker already exists, so we'll just change its position.
        else {
          marker.setPosition(latLng);
        }

        // Center and zoom the map view onto the current position.
        map.instance.setCenter(marker.getPosition());
        map.instance.setZoom(MAP_ZOOM);
      });
    });
  });

  Template.map.helpers({
    geolocationError: function() {
      var error = Geolocation.error();
      //var loc = places;
      //Geocode(Geolocation.latLng());
      return error && error.message;
    },
    mapOptions: function() {
      var latLng = Geolocation.latLng();
      // Initialize the map once we have the latLng.
      if (GoogleMaps.loaded() && latLng) {
        return {
          center: new google.maps.LatLng(latLng.lat, latLng.lng),
          zoom: MAP_ZOOM
        };
      }
    }
  });
}
