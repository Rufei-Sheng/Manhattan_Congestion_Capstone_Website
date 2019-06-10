mapboxgl.accessToken = 'pk.eyJ1IjoicnVmZWlmZmZmZmZmIiwiYSI6ImNqdXczZWZ1NjA4Yjc0ZHBmdHVlYTVhNHgifQ.h-vyoVrI270wgwU6Y11NOQ';

// define the map container
var map = new mapboxgl.Map({
  container: 'mapContainer',
  center: [-73.97604882, 40.7489006],
  style: 'mapbox://styles/mapbox/streets-v9',
  // change the style can change map
  zoom: 10.5,
});

map.addControl(new mapboxgl.NavigationControl());

// define function to color each taxi zone with highest possible transporatation manner
var TopTransportation = (choice) => {
  switch (choice) {
    case 'Public Transit':
      return {
        color: '#98CDCE',
        description: 'Public Transit is the top choice',
      };

    case 'Taxi':
      return {
        color: '#FCCF76',
        description: 'Taxi is the top choice',
      };

    case 'Others':
      return {
        color: '#D4FCFF',
        description: 'Another manners is the top choice',
      };

    default:
      return{
        color: '#D4FCFF',
        description: 'Other commute manner',
      };
  }
};

// use J-query to create a legend to explain the colors in each taxi zone
let mode = ['Public Transit', 'Taxi', 'Others'];
for (let i = 0; i < mode.length; i++) {
  const choiceinfo = TopTransportation(mode[i]);

  $('.legend').append(`
    <div>
      <div class='legend-color-box' style='background-color:${choiceinfo.color};'></div>
      ${choiceinfo.description}
    </div>
    `)
}

// marker the subway location
subwayStationLocation.forEach(function(subwayStation) {
    var popup = new mapboxgl.Popup({
        offset: 2})
        .setText(`${subwayStation.name}`);

    var el = document.createElement('div');
    el.className = 'marker';

    // add marker to map
    new mapboxgl.Marker(el)
    .setLngLat([subwayStation.longitude, subwayStation.latitude])
    .setPopup(popup)
    .addTo(map);

})

// define airport location
var airportLocation = {
  'JFK_airport' : [-73.7803278, 40.6413111],
  'EWR_airport' : [-74.1766511, 40.6895314],
  'LGA_airport' : [-73.8761546, 40.7769271],
  'Back': [-73.97604882, 40.7489006],
}
// add functions when moving mouse
map.on('style.load', function() {
// fly to airport location
  $('.flyto').on('click', function(e) {
    var airport = $(e.target).data('airport');
    var center = airportLocation[airport];
    map.flyTo({center: center, zoom: 12});

  })
// add source and layers
  map.addSource('NYC_Taxi_Zones', {
      type: 'geojson',
      data: './data/NYC_transportationChoice.geojson',
  });

  map.addLayer({
    id: 'taxi_zone_fill',
    type: 'fill',
    source: 'NYC_Taxi_Zones',
    paint: {
      'fill-opacity' : 0.7,
      'fill-color' : {
        type: 'categorical',
        property: 'Top_choice',
        stops: [
          [
            'Public Transit',
            TopTransportation('Public Transit').color,
          ],
          [
            'Taxi',
            TopTransportation('Taxi').color,
          ],
          [
            'Others',
            TopTransportation('Others').color,
          ],
        ]
      }
    }
  });

  map.addLayer({
    id: 'NYC_Taxi_Zones_line',
    type: 'line',
    source: 'NYC_Taxi_Zones',
    paint: {
      'line-opacity': 0.7,
      'line-color': 'gray',
      'line-opacity': {
        stops: [[10, 0], [11, 1]],
      }
    }
  })

  map.addSource('highlight-feature', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  })

  map.addLayer({
    id: 'highlight-line',
    type: 'line',
    source: 'highlight-feature',
    paint: {
      'line-width' : 3,
      'line-opacity' : 0.9,
      'line-color' : 'black'
    }
  });
  // change infor-box contents when moving mouse
  // var currentZone = null;
  map.on('mousemove', function(e) {
    var features = map.queryRenderedFeatures(e.point, {
        layers: ['taxi_zone_fill'],
    });

    var taxi_zone = features[0]
    if (taxi_zone) {
      // currentZone = taxi_zone.properties.objectid
      map.getCanvas().style.cursor = 'pointer';
      $('#zonename').text(taxi_zone.properties.zone);
      $('#brough').text(taxi_zone.properties.borough);
      $('#distribution').text('Transportation Choice in This Zone');
      map.getSource('highlight-feature').setData(taxi_zone.geometry);

      //do the pie chart
      // perpare the data
      var pieData = [
          {
            'label': 'Public Transit',
            'value': taxi_zone.properties.Public_Transit
          },
          {
            'label': 'Taxi',
            'value': taxi_zone.properties.Taxi
          },
          {
            'label': 'Others',
            'value': taxi_zone.properties.Others
          },
        ];

      var height = 250;
      var width = 250;
      //Create regular pie chart
      nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .width(width)
            .height(height)
            .labelType('value');

          d3.select("#piechart")
              .datum(pieData)
              .transition().duration(350)
              .attr('width', width)
              .attr('height', height)
              .call(chart);

        return chart;
      });
    }
    else{
      map.getCanvas().style.cursor = 'default';
      map.getSource('highlight-feature').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  })
})
