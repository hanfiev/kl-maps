//load data

function fetchData(name) {
    fetch('data/' + name + '.json')
        .then(response => response.json())
        .then(data => console.log(data));
}


var acc = document.getElementsByClassName("title");

for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function () {
        /* Toggle between adding and removing the "active" class,
        to highlight the button that controls the panel */
        var panel = this.nextElementSibling;
        if (this.classList[2] === "active") {
            $(panel).hide(500)
        } else {
            $(panel).show(500)
        }

        this.classList.toggle("active");

        /* Toggle between hiding and showing the active panel */

    });
}


// map
var center = [101.693207, 3.140853] // starting position [lng, lat]

mapboxgl.accessToken = 'pk.eyJ1IjoiaGFuZmlldiIsImEiOiJQYlFjVlNvIn0.ukrwZz0v6BXZEOsJHBdgDg';
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: center, // starting position [lng, lat]
    zoom: 12 // starting zoom
});

map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    })
);


//dot
var size = 100;

// implementation of CustomLayerInterface to draw a pulsing dot icon on the map
// see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
var pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    // get rendering context for the map canvas when layer is added to the map
    onAdd: function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
    },

    // called once before every frame where the icon will be used
    render: function () {
        var duration = 1000;
        var t = (performance.now() % duration) / duration;

        var radius = (size / 2) * 0.3;
        var outerRadius = (size / 2) * 0.7 * t + radius;
        var context = this.context;

        // draw outer circle
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
            this.width / 2,
            this.height / 2,
            outerRadius,
            0,
            Math.PI * 2
        );
        context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
        context.fill();

        // draw inner circle
        context.beginPath();
        context.arc(
            this.width / 2,
            this.height / 2,
            radius,
            0,
            Math.PI * 2
        );
        context.fillStyle = 'rgba(255, 100, 100, 1)';
        context.strokeStyle = 'white';
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        // update this image's data with data from the canvas
        this.data = context.getImageData(
            0,
            0,
            this.width,
            this.height
        ).data;

        // continuously repaint the map, resulting in the smooth animation of the dot
        map.triggerRepaint();

        // return `true` to let the map know that the image was updated
        return true;
    }
};

//end dot


map.on('load', function () {

    //circle
    map.addSource('circle', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [
                        [

                        ]
                    ]
                }
            }]
        }
    });
    map.addLayer({
        'id': 'circle',
        'type': 'fill',
        'source': 'circle',
        'layout': {

        },
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.2
        }
    });

    //dot

    map.addImage('pulsing-dot', pulsingDot, {
        pixelRatio: 2
    });

    map.addSource('points', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [101.693207, 3.140853]
                }
            }]
        }
    });
    map.addLayer({
        'id': 'points',
        'type': 'symbol',
        'source': 'points',
        'layout': {
            'icon-image': 'pulsing-dot'
        }
    });

    //atm

    map.addSource('atm', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [0, 0]
                }
            }]
        }
    });
    map.addLayer({
        'id': 'atm',
        'type': 'symbol',
        'source': 'atm',
        'layout': {
            'icon-image': 'pulsing-dot'
        }
    });


});


map.on('click', function (e) {
    center = [e.lngLat.lng, e.lngLat.lat]
    let data = {
        'type': 'FeatureCollection',
        'features': [{
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': center
            }
        }]
    }

    map.getSource('points').setData(data);
    drawCircle();
    document.getElementById('placeCoord').innerHTML = center;
})

var radius = '';
var options = {};
var circle = '';

function drawCircle() {
    radius = 5;
    options = {
        steps: 100,
        units: 'kilometers',

    };
    circle = turf.circle(center, radius, options);
    map.getSource('circle').setData(circle)


}