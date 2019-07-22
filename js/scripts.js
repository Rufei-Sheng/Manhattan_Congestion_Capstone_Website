mapboxgl.accessToken = 'pk.eyJ1IjoicnVmZWlmZmZmZmZmIiwiYSI6ImNqdXczZWZ1NjA4Yjc0ZHBmdHVlYTVhNHgifQ.h-vyoVrI270wgwU6Y11NOQ';

// define the map container
var map = new mapboxgl.Map({
  container: 'mapContainer',
  center: [-73.97604882, 40.7489006],
  style: 'mapbox://styles/mapbox/streets-v9',
  // change the style can change map
  zoom: 10.5,
});

var map2 = new mapboxgl.Map({
  container: 'mapContainer2',
  center: [-73.97604882, 40.7489006],
  style: 'mapbox://styles/mapbox/streets-v9',
  // change the style can change map
  zoom: 10.5,
});


map.addControl(new mapboxgl.NavigationControl());
map2.addControl(new mapboxgl.NavigationControl());

// Functions for first map
// define function to color each taxi zone with highest possible transporatation manner
var IncomeLevel = (level) => {
  switch (level) {
    case 'Level1':
      return {
        color: '#548DFF',
        description: 'Median household income (21956.0, 58767.9]',
      };

      case 'Level2':
        return {
          color: '#94C2FF',
          description: 'Median household income (58767.9, 95579.8]',
        };

    case 'Level3':
      return {
        color: '#F0E15E',
        description: 'Median household income (95579.8, 132391.7]',
      };

      case 'Level4':
        return {
          color: '#FFB70F',
          description: 'Median household income (132391.7, 169203.6]',
        };

        case 'Level5':
          return {
            color: '#F08686',
            description: 'Median household income (169203.6, 206015.5]',
          };

    // default:
    //   return{
    //     color: '#D4FCFF',
    //     description: 'Other commute manner',
    //   };
  }
};

// use J-query to create a legend to explain the colors in each taxi zone
let income = ['Level1', 'Level2', 'Level3', 'Level4', 'Level5'];
for (let i = 0; i < income.length; i++) {
  const incomeinfo = IncomeLevel(income[i]);

  $('.legend').append(`
    <div>
      <div class='legend-color-box' style='background-color:${incomeinfo.color};'></div>
      ${incomeinfo.description}
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

// define flyto function
var flytoLocation = {
  'CongestionArea' : [-74.0021727, 40.7560878],
  'Back': [-73.97604882, 40.7489006],
}
// add functions when moving mouse
map.on('style.load', function() {

// fly to interested location
  $('.flyto').on('click', function(e) {
    var congestionzone = $(e.target).data('congestionzone');
    var center = flytoLocation[congestionzone];
    map.flyTo({center: center, zoom: 12});
  })
  $('.flyto1').on('click', function(e) {
    var back = $(e.target).data('back');
    var center = flytoLocation[back];
    map.flyTo({center: center, zoom: 10.5});
  })

// add source and layers
  map.addSource('NYC_Taxi_Zones', {
      type: 'geojson',
      data: './data/NYC_transportation_Choice.geojson',
  });

  map.addLayer({
    id: 'taxi_zone_fill',
    type: 'fill',
    source: 'NYC_Taxi_Zones',
    paint: {
      'fill-opacity' : 0.7,
      'fill-color' : {
        type: 'categorical',
        property: 'income_class',
        stops: [
          [
            'Level1',
            IncomeLevel('Level1').color,
          ],
          [
            'Level2',
            IncomeLevel('Level2').color,
          ],
          [
            'Level3',
            IncomeLevel('Level3').color,
          ],
          [
            'Level4',
            IncomeLevel('Level4').color,
          ],
          [
            'Level5',
            IncomeLevel('Level5').color,
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
      $('#distribution').text('Transportation Choice for Scenario1:');
      $('#distribution2').text('Transportation Choice for Scenario2:');
      $('#distribution3').text('Transportation Choice for Scenario3:');
      map.getSource('highlight-feature').setData(taxi_zone.geometry);

      //do the pie chart
      // pieData: show nest proportions for scenario1
      var pieData = [
          {
            'label': 'taxi/FHV/sharedFHV',
            'value': taxi_zone.properties.nest1_1
          },
          {
            'label': 'public transit',
            'value': taxi_zone.properties.public_transit1
          },
          {
            'label': 'walking',
            'value': taxi_zone.properties.walking1
          },
          {
            'label': 'private vehicles',
            'value': taxi_zone.properties.private_vehicles1
          },
        ];
        // pieData2: show nest proportions for scenario2
        var pieData2 = [
            {
              'label': 'taxi/FHV/sharedFHV',
              'value': taxi_zone.properties.nest1_2
            },
            {
              'label': 'public transit',
              'value': taxi_zone.properties.public_transit2
            },
            {
              'label': 'walking',
              'value': taxi_zone.properties.walking2
            },
            {
              'label': 'private vehicles',
              'value': taxi_zone.properties.private_vehicles2
            },
          ];

          // pieData3: show nest proportions for scenario3
          var pieData3 = [
              {
                'label': 'taxi/FHV/sharedFHV',
                'value': taxi_zone.properties.nest1_3
              },
              {
                'label': 'public transit',
                'value': taxi_zone.properties.public_transit3
              },
              {
                'label': 'walking',
                'value': taxi_zone.properties.walking3
              },
              {
                'label': 'private vehicles',
                'value': taxi_zone.properties.private_vehicles3
              },
            ];

      var height = 250;
      var width = 350;
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

      nv.addGraph(function() {
        var chart2 = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .width(width)
            .height(height)
            .labelType('value');

          d3.select("#piechart2")
              .datum(pieData2)
              .transition().duration(350)
              .attr('width', width)
              .attr('height', height)
              .call(chart2);

        return chart2;
      });

      nv.addGraph(function() {
        var chart3 = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .width(width)
            .height(height)
            .labelType('value');

          d3.select("#piechart3")
              .datum(pieData3)
              .transition().duration(350)
              .attr('width', width)
              .attr('height', height)
              .call(chart3);
        return chart3;
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


// define functions for the second map
// define function to color each taxi zone with proportion of people working in congestion zone
var WorkProp = (level) => {
  switch (level) {
    case 0:
      return {
        color: '#548DFF',
        description: '0% - 33.38% people working in congestion zone area',
      };

    case 1:
      return {
          color: '#94C2FF',
          description: '33.46% - 38.13% people working in congestion zone area',
        };

    case 2:
      return {
        color: '#FFB70F',
        description: '38.36% - 57.74% people working in congestion zone area',
      };

    case 3:
      return {
          color: '#F08686',
          description: '58.19% - 83.5% people working in congestion zone area',
        };
    // default:
    //   return{
    //     color: '#D4FCFF',
    //     description: 'Other commute manner',
    //   };
  }
};

// use J-query to create a legend to explain the colors in each taxi zone
let work = [0, 1, 2, 3];
for (let i = 0; i < work.length; i++) {
  const workinfo = WorkProp(work[i]);

  $('.legend2').append(`
    <div>
      <div class='legend-color-box' style='background-color:${workinfo.color};'></div>
      ${workinfo.description}
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
    .addTo(map2);

})

// define flyto function
var flytoLocation = {
  'CongestionArea' : [-74.0021727, 40.7560878],
  'Back': [-73.97604882, 40.7489006],
}
// add functions when moving mouse
map2.on('style.load', function() {

// fly to interested location
  $('.flyto').on('click', function(e) {
    var congestionzone = $(e.target).data('congestionzone');
    var center = flytoLocation[congestionzone];
    map2.flyTo({center: center, zoom: 12});
  })
  $('.flyto1').on('click', function(e) {
    var back = $(e.target).data('back');
    var center = flytoLocation[back];
    map2.flyTo({center: center, zoom: 10.5});
  })

//
// // define and fly to the airport location
// var airportLocation = {
//   'JFK_airport' : [-73.7803278, 40.6413111],
//   'EWR_airport' : [-74.1766511, 40.6895314],
//   'LGA_airport' : [-73.8761546, 40.7769271],
//   'Back': [-73.97604882, 40.7489006],
// }
// // add functions when moving mouse
// map2.on('style.load', function() {
// // fly to airport location
//   $('.flyto').on('click', function(e) {
//     var airport = $(e.target).data('airport');
//     var center = airportLocation[airport];
//     map2.flyTo({center: center, zoom: 12});
//   })


// add source and layers
  map2.addSource('NYC_Taxi_Zones2', {
      type: 'geojson',
      data: './data/NYC_transportation_Choice2.geojson',
  });

  map2.addLayer({
    id: 'taxi_zone_fill2',
    type: 'fill',
    source: 'NYC_Taxi_Zones2',
    paint: {
      'fill-opacity' : 0.7,
      'fill-color' : {
        type: 'categorical',
        property: 'prop_class',
        stops: [
          [
            0,
            WorkProp(0).color,
          ],
          [
            1,
            WorkProp(1).color,
          ],
          [
            2,
            WorkProp(2).color,
          ],
          [
            3,
            WorkProp(3).color,
          ],
        ]
      }
    }
  });

  map2.addLayer({
    id: 'NYC_Taxi_Zones_line2',
    type: 'line',
    source: 'NYC_Taxi_Zones2',
    paint: {
      'line-opacity': 0.7,
      'line-color': 'gray',
      'line-opacity': {
        stops: [[10, 0], [11, 1]],
      }
    }
  })

  map2.addSource('highlight-feature', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  })

  map2.addLayer({
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
  map2.on('mousemove', function(e) {
    var features = map2.queryRenderedFeatures(e.point, {
        layers: ['taxi_zone_fill2'],
    });

    var taxi_zone = features[0]
    if (taxi_zone) {
      // currentZone = taxi_zone.properties.objectid
      map2.getCanvas().style.cursor = 'pointer';
      $('#zonename2').text(taxi_zone.properties.zone);
      $('#brough2').text(taxi_zone.properties.borough);
      $('#distribution4').text('Transportation Choice for Scenario1:');
      $('#distribution5').text('Transportation Choice for Scenario2:');
      $('#distribution6').text('Transportation Choice for Scenario3:');
      map2.getSource('highlight-feature').setData(taxi_zone.geometry);

      //do the pie chart
      // pieData4: the proportion of choose taxi/FHV/sharedFHV/private vehicles for scenario1
      var pieData4 = [
          {
            'label': 'taxi',
            'value': taxi_zone.properties.taxi1
          },
          {
            'label': 'for-hire-vehicles',
            'value': taxi_zone.properties.FHV1
          },
          {
            'label': 'shared FHV',
            'value': taxi_zone.properties.shared_FHV1
          },
          {
            'label': 'private vehicles',
            'value': taxi_zone.properties.public_transit1
          },
        ];

        // pieData5: the proportion of choose taxi/FHV/sharedFHV/private vehicles for scenario2
        var pieData5 = [
            {
              'label': 'taxi',
              'value': taxi_zone.properties.taxi2
            },
            {
              'label': 'for-hire-vehicles',
              'value': taxi_zone.properties.FHV2
            },
            {
              'label': 'shared FHV',
              'value': taxi_zone.properties.shared_FHV2
            },
            {
              'label': 'private vehicles',
              'value': taxi_zone.properties.public_transit2
            },
          ];

          // pieData6: the proportion of choose taxi/FHV/sharedFHV/private vehicles for scenario3
          var pieData6 = [
              {
                'label': 'taxi',
                'value': taxi_zone.properties.taxi3
              },
              {
                'label': 'for-hire-vehicles',
                'value': taxi_zone.properties.FHV3
              },
              {
                'label': 'shared FHV',
                'value': taxi_zone.properties.shared_FHV3
              },
              {
                'label': 'private vehicles',
                'value': taxi_zone.properties.public_transit3
              },
            ];

      var height = 250;
      var width = 350;
      //Create regular pie chart
      nv.addGraph(function() {
        var chart4 = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .width(width)
            .height(height)
            .labelType('value');

          d3.select("#piechart4")
              .datum(pieData4)
              .transition().duration(350)
              .attr('width', width)
              .attr('height', height)
              .call(chart4);

        return chart4;
      });

      nv.addGraph(function() {
        var chart5 = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .width(width)
            .height(height)
            .labelType('value');

          d3.select("#piechart5")
              .datum(pieData5)
              .transition().duration(350)
              .attr('width', width)
              .attr('height', height)
              .call(chart5);

        return chart5;
      });

      nv.addGraph(function() {
        var chart6 = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .width(width)
            .height(height)
            .labelType('value');

          d3.select("#piechart6")
              .datum(pieData6)
              .transition().duration(350)
              .attr('width', width)
              .attr('height', height)
              .call(chart6);

        return chart6;
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
