mapboxgl.accessToken = 'pk.eyJ1IjoidXJiYW4wMSIsImEiOiJjam50MXJoMG4wMXBqM3FwbWViMjN5MW1wIn0.fw5_hMbQv0qyZkLaVJBbFQ';

tripsFile = 'trips-ec.json';
let trips = {};


const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-78, -2], // starting position
  zoom: 6
});

// Guayaquil
const origin = [-79.88, -2.18];

// Quito
const destination = [-78.5, -0.18];


const radius = 0.6;

// Animation controls
let animRequest;
let animStatus = false;

let counter=0;

function pointOnCircle(p) {
  counter++;
  return {
    'type': 'Point',
    'coordinates': trips.geopair[0].mapboxapiroute.routes[0].geometry.coordinates[counter]
  };
}


let ptemp = new PointSource('point3', origin, destination, 'circle', 15, 'green');

// Read coordinate data from file
async function getCsvData(fileName) {
  const response = await fetch(fileName);
  const data = await response.text();
  let i = 0;
  const table = data.split('\n');
  table.forEach(row => {
    const r = row.split(',');
    dataArray[i] = r;
    i++;
  })
}

async function getJsonData(fileName) {
  const response = await fetch(fileName);
  const data = await response.json();
  return data;
}

async function getRoute(origin, destination) {

  const query = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );
  const json = await query.json();
  //const data = json.routes[0];
  //const rte = data.geometry.coordinates;
  return json;
}

async function getAllTripRoutes(trips) {
  for(let i=0; i < trips.geopair.length; i++){
    const org = [trips.geopair[i].origin];
    const dst = [trips.geopair[i].destination];
    const res = await getRoute(org, dst);
    trips.geopair[i].mapboxapiroute = res;
  }

}

// Read JSON file with orig/dest, color, size, etc
getJsonData(tripsFile)
  .then( (d) => { trips = d })
  .then( () => getAllTripRoutes(trips) )
  .then( () => console.log(trips));




map.on('load', () => {

  // Add a source and layer displaying a point which will be animated in a circle.
  map.addSource('point', {
    'type': 'geojson',
    'data': pointOnCircle(0)
  });

  // map.addSource('point2', {
  //   'type': 'geojson',
  //   'data': pointOnCircle(0)
  // });


  //map.addSource(ptemp.pointSourceObj[0], ptemp.pointSourceObj[1]);


  map.addLayer({
    'id': 'point',
    'source': 'point',
    'type': 'circle',
    'paint': {
      'circle-radius': 10,
      'circle-color': 'brown'
    }
  });

  // map.addLayer({
  //   'id': 'point2',
  //   'source': 'point2',
  //   'type': 'circle',
  //   'paint': {
  //     'circle-radius': 10,
  //     'circle-color': 'red'
  //   }
  // });

  //map.addLayer(ptemp.pointLayerObj);

  function animateCircle(timestamp) {
    // Update the data to a new position based on the animation timestamp. The
    // divisor in the expression `timestamp / 1000` controls the animation speed.

    map.getSource('point').setData(pointOnCircle(timestamp / 50));
    //map.getSource('point2').setData(pointOnCircle(timestamp / 4000));

    // Request the next frame of the animation.
    // animateCircle is the callback and is given a timestamp
    // similar to performance.now()
    animRequest = requestAnimationFrame(animateCircle);
  }


  //Create a new marker.
  const marker = new mapboxgl.Marker(
    {
      color: 'blue',
      draggable: true
    }
  )
    .setLngLat([-78.5, -.18])
    .addTo(map);

  document.getElementById('replay').addEventListener('click', () => {
    // Toggle the animation status then start or stop animation
    animStatus = !animStatus;
    if (!animStatus) cancelAnimationFrame(animRequest);
    else animRequest = animateCircle(0);


  }); // end event listener click



}) // end map on load


// Class for holding point sources

