import React, { Component } from "react";
import LocationList from "./LocationList";

class App extends Component {
  /**
   * Constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      alllocations: require("./places.json"), // Get the locations from the JSON file
      map: "",
      infowindow: "",
      prevmarker: ""
    };

    // retain object instance when used in the function
    this.initMap = this.initMap.bind(this);
    this.openInfoWindow = this.openInfoWindow.bind(this);
    this.closeInfoWindow = this.closeInfoWindow.bind(this);
  }

  componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    loadMapJS(
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDWmB3dGaB0hh6-CWcCSI2ldW39iDJAOVE&callback=initMap"
      );
  }

  /**
   * Initialise the map once the google map script is loaded
   */
  initMap() {
    var self = this;

    var mapview = document.getElementById("map");
    mapview.style.height = window.innerHeight + "px";
    var map = new window.google.maps.Map(mapview, {
      center: { lat: 30.0518051, lng: 31.4022244 },
      zoom: 11
 ,
      mapTypeControl: false
      ,  scrollwheel: false
    });

    var InfoWindow = new window.google.maps.InfoWindow({});

    window.google.maps.event.addListener(InfoWindow, "closeclick", function() {
      self.closeInfoWindow();
    });

    this.setState({
      map: map,
      infowindow: InfoWindow
    });

    window.google.maps.event.addDomListener(window, "resize", function() {
      var center = map.getCenter();
      window.google.maps.event.trigger(map, "resize");
      self.state.map.setCenter(center);
    });

    window.google.maps.event.addListener(map, "click", function() {
      self.closeInfoWindow();
    });

    var alllocations = [];
    
    this.state.alllocations.forEach(function(location) {
      var longname = location.title;
      var marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(
          location.location.lat,
          location.location.lng
        ),
        animation: window.google.maps.Animation.DROP,
        map: map
      });

      marker.addListener("click", function() {
        self.openInfoWindow(marker);
      });

      location.longname = longname;
      location.marker = marker;
      location.display = true;
      alllocations.push(location);
    });
    this.setState({
      alllocations: alllocations
    });
  }

  /**
   * Open the infowindow for the marker
   * @param {object} location marker
   */
  openInfoWindow(marker) {
    this.closeInfoWindow();
    this.state.infowindow.open(this.state.map, marker);
    marker.setAnimation(window.google.maps.Animation.BOUNCE);
    this.setState({
      prevmarker: marker
    });
    this.state.infowindow.setContent("Loading Data...");
    this.state.map.setCenter(marker.getPosition());
    this.state.map.panBy(0, -200);
    this.getMarkerInfo(marker);
  }

  /**
   * Retrive the location data from the foursquare api
   */
  getMarkerInfo(marker) {
    var self = this;

    // Add the api keys for foursquare
    var clientId = "LQJBMPLLB3RPAMFT4RP4LVJ5HREIJ5ZOMHFLDKH3MQXGKUQQ";
    var clientSecret = "23IFEDLX4JGTRNBIDU4TFCX24BY155043X4SVVBUUKAVDVFA";

    // Build the api endpoint
    var url =
      "https://api.foursquare.com/v2/venues/search?client_id=" +
      clientId +
      "&client_secret=" +
      clientSecret +
      "&v=20181125&ll=" +
      marker.getPosition().lat() +
      "," +
      marker.getPosition().lng() +
      "&limit=1";
    fetch(url)
      .then(function(response) {
        if (response.status !== 200) {
          self.state.infowindow.setContent("Sorry data can't be loaded");
          return;
        }

        // Get the text in the response
        response.json().then(function(data) {
          console.log(data);

          var location_data = data.response.venues[0];
          var place = `<h3>${location_data.name?location_data.name:""}</h3>`;
          var street = `<p>${location_data.location.formattedAddress[0]?location_data.location.formattedAddress[0]:""}</p>`;
           var contact = `<p><small>${location_data.contact?location_data.contact.phone:""}</small></p>`;
         
          var  address = `<p><small>${location_data.location.address || ''}</small></p>`;
          var  city =`<p><small>${ location_data.location.city || ''}</small></p>`;
           var country =`<p><small>${ location_data.location.country || ''}</small></p>`;
          
          var readMore =
            '<a href="https://foursquare.com/v/' +
            location_data.id +
            '" target="_blank">Read More on <b>Foursquare Website</b></a>';
          self.state.infowindow.setContent(
            place + street+address+city+country +contact +readMore
          );
        });
      })
      .catch(function(err) {
        self.state.infowindow.setContent("Sorry data can't be loaded");
      });
  }

  /**
   * Close the info window previously opened
   *
   * @memberof App
   */
  closeInfoWindow() {
    if (this.state.prevmarker) {
      this.state.prevmarker.setAnimation(null);
    }
    this.setState({
      prevmarker: ""
    });
    this.state.infowindow.close();
  }

  /**
   * Render for react
   */
  render() {
    return (
      <div>
        <LocationList
          key="100"
          alllocations={this.state.alllocations}
          openInfoWindow={this.openInfoWindow}
          closeInfoWindow={this.closeInfoWindow}
        />
        <div id="map" />
      </div>
    );
  }
}

export default App;

/**
 * Load the google maps
 * @param {src} url of the google maps script
 */
function loadMapJS(src) {
  var ref = window.document.getElementsByTagName("script")[0];
  var script = window.document.createElement("script");
  script.src = src;
  script.async = true;

  script.onerror = function() {
    document.write("Google Maps can't be loaded");
  };
  ref.parentNode.insertBefore(script, ref);
}
