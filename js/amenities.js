//load data

// [0] ATM
// [1] Clinic
// [2] CStore
// [3] Supermarket
// [4] Foodstall
// [5] Train

var amenitiesID = ['atm', 'clinic', 'cstore', 'supermarket', 'foodstall', 'transit']
var itemColor = ['#2B255C', '#8249FF', '#FEB800', '#FC3365', '#00CC88', '#0087FF']
var itemName = [],
    withinItem = [],
    items = [],
    lenVar = [];
// train = '';


for (i = 0; i < amenitiesID.length; i++) {
    itemName.push(i + "-" + amenitiesID[i]) //ini buat generate nama file
    lenVar.push(amenitiesID[i] + "Len") //ini buat generate var buat ngubah jumlah
}

function fetchAllData() {
    for (i = 0; i < itemName.length; i++) {
        let name = itemName[i]
        setTimeout(function (name) {
            fetch('../data/' + name + '.geojson')
                .then(response => response.json())
                .then(data => items.push(data));
        }, i * 500, name);
    }

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

    fetchAllData()

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

    generateMapLayer()

    // Insert the layer beneath any symbol layer.
    var layers = map.getStyle().layers;

    var labelLayerId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
                'fill-extrusion-color': '#aaa',

                // use an 'interpolate' expression to add a smooth transition effect to the
                // buildings as the user zooms in
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
            }
        },
        labelLayerId
    );


});

var withinItem = []

function withinData() {
    for (i = 0; i < items.length; i++) {
        withinItem[i] = {}
        withinItem[i] = turf.pointsWithinPolygon(items[i], circle);
    }
}


function generateMapLayer() {
    //for transit
    // map.addSource('train', {
    //     'type': 'geojson',
    //     'data': {
    //         'type': 'FeatureCollection',
    //         'features': [{
    //             'type': 'Feature',
    //             'geometry': {
    //                 'type': 'Polygon',
    //                 'coordinates': [
    //                     [

    //                     ]
    //                 ]
    //             }
    //         }]
    //     }
    // });

    // map.addLayer({
    //     'id': 'train',
    //     'type': 'circle',
    //     'source': 'train',
    //     'paint': {
    //         'circle-color': '#327ba8',
    //         'circle-radius': 7
    //     }
    // })


    // generate source
    for (i = 0; i < itemName.length; i++) {
        map.addSource(itemName[i], {
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
            'id': itemName[i],
            'type': 'circle',
            'source': itemName[i],
            'paint': {
                'circle-color': itemColor[i],
                'circle-radius': 7
            }
        })
    }
}



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

    $('#intro').hide(500)
    $('#results').show(500)
    $('#surroundingAmenities').show(500)

    document.getElementById('placeCoord').innerHTML = e.lngLat.lng.toFixed(5) + ", " + e.lngLat.lat.toFixed(5);
    map.getSource('points').setData(data);
    drawCircle();
    withinData();
    measureDistance()
    updateLen()
    mapZoom()
    checkOverview()
})

var circle = '';

function drawCircle() {
    let radius = 0.5;
    let options = {
        steps: 100,
        units: 'kilometers',

    };
    circle = turf.circle(center, radius, options);
    map.getSource('circle').setData(circle)
}

function measureDistance() {

    for (i = 0; i < amenitiesID.length; i++) {
        document.getElementById(amenitiesID[i]).innerHTML = ''

        for (j = 0; j < withinItem[i].features.length; j++) {
            let base = withinItem[i].features[j].properties

            //measure distance
            let from = turf.point(center);
            let to = turf.point([base.longitude, base.latitude]);
            let options = {
                units: 'kilometers'
            };
            base.distance = turf.distance(from, to, options);
        }
        let sortbase = withinItem[i].features
        sortbase.sort((a, b) => a.properties.distance - b.properties.distance)
    }

    redrawResults() //special treatment buat tab yang transit karena beda format
    withinDataUpdate()
}

function redrawResults() {




    for (i = 0; i < amenitiesID.length - 1; i++) {
        document.getElementById(amenitiesID[i]).innerHTML = ''

        if (withinItem[i].features.length <= 5) {
            for (j = 0; j < withinItem[i].features.length; j++) {

                let base = withinItem[i].features[j].properties

                let item = document.createElement('div');
                item.className = 'item';

                let object = document.createElement('div');
                object.className = 'object';
                object.innerHTML = base.name;

                let distance = document.createElement('distance');
                distance.className = 'distance';
                distance.innerHTML = base.distance.toFixed(2) * 1000 + ' m'

                item.appendChild(object);
                item.appendChild(distance);
                document.getElementById(amenitiesID[i]).appendChild(item);
            }
        } else {
            for (j = 0; j < 5; j++) {
                let base = withinItem[i].features[j].properties

                let item = document.createElement('div');
                item.className = 'item';

                let object = document.createElement('div');
                object.className = 'object';
                object.innerHTML = base.name;

                let distance = document.createElement('distance');
                distance.className = 'distance';
                distance.innerHTML = base.distance.toFixed(2) * 1000 + ' m'

                item.appendChild(object);
                item.appendChild(distance);
                document.getElementById(amenitiesID[i]).appendChild(item);
            }
        }

    }
    //for transit
    document.getElementById(amenitiesID[5]).innerHTML = ''
    for (k = 0; k < withinItem[5].features.length; k++) {
        let base = withinItem[5].features[k].properties

        let item = document.createElement('div');
        item.className = 'item';

        let object = document.createElement('div');
        object.className = 'object';

        let distance = document.createElement('distance');
        distance.className = 'distance';
        distance.innerHTML = base.distance.toFixed(2) * 1000 + ' m'

        let span = document.createElement('span');
        span.innerHTML = base.station_id

        let transitObject = document.createElement('div')
        transitObject.className = 'transit-object'

        let transitRoute = document.createElement('div')
        transitRoute.className = 'route'
        transitRoute.innerHTML = base.name

        let transitService = document.createElement('div')
        transitService.className = 'service'
        transitService.innerHTML = base.mode

        transitObject.appendChild(transitRoute)
        transitObject.appendChild(transitService)

        object.appendChild(span)
        object.appendChild(transitObject)

        item.appendChild(object)
        item.appendChild(distance)


        document.getElementById(amenitiesID[5]).appendChild(item);
    }
}

function withinDataUpdate() {
    for (i = 0; i < itemName.length; i++) {
        map.getSource(itemName[i]).setData(withinItem[i]);
    }
}

function updateLen() {
    for (i = 0; i < lenVar.length; i++) {
        document.getElementById(lenVar[i]).innerHTML = "(" + withinItem[i].features.length + ")";
    }
}

//TODO bikin kategorisasi surrounding amenities & food access

function checkOverview() {
    // convert arrLen to Boolean
    let lenBool = []
    for (i = 0; i < withinItem.length; i++) {
        lenBool.push(withinItem[i].features.length >= 1)
    }
    console.log(lenBool[0] && lenBool[1])

    let saOverview = lenBool[0] && lenBool[1] && lenBool[2]
    let faOverview = lenBool[3] || lenBool[4]

    let icon = ['alert-triangle', 'check-circle']
    console.log(saOverview)


    if (saOverview) {
        $('#saOverview').html('<i data-feather="check-circle"></i><span class="tooltiptext">This place meets the standard amenities</span>')
    } else {
        $('#saOverview').html('<i data-feather=alert-triangle></i><span class="tooltiptext">This place have not meets the standard amenities</span>')
        console.log("salah")
    }

    if (faOverview) {
        $('#faOverview').html('<i data-feather="check-circle"></i><span class="tooltiptext">This place surrounded by food provider</span>')
    } else {
        $('#faOverview').html('<i data-feather=alert-triangle></i><span class="tooltiptext">This place is not surrounded by food provider</span>')
        console.log("salah")
    }

    feather.replace()
}

function mapZoom() {
    map.flyTo({
        // These options control the ending camera position: centered at
        // the target, at zoom level 9, and north up.
        center: center,
        zoom: 16,
        bearing: 15,
        pitch: 30,
        speed: 0.5
    })
}

function mapReturn() {
    $('#intro').show(500)
    $('#results').hide(500)
    $('#surroundingAmenities').hide(500)


    map.flyTo({
        // These options control the ending camera position: centered at
        // the target, at zoom level 9, and north up.
        center: center,
        zoom: 12,
        bearing: 0,
        pitch: 0
    })

    let emptyData = {
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

    map.getSource('circle').setData(emptyData)
    for (i = 0; i < itemName.length; i++) {
        map.getSource(itemName[i]).setData(emptyData)
    }
    for (i = 0; i < amenitiesID.length; i++) {
        document.getElementById(amenitiesID[i]).innerHTML = '';
        document.getElementById(lenVar[i]).innerHTML = '';
    }
}



//SEARCH

function fetchGeocode(searchQuery) {
    let baseurl = 'https://us1.locationiq.com/v1/search.php?key=pk.f7842b4cd12bb3400a2e5b6390dd2a2c&q=' + searchQuery + '&countrycodes=my&format=json'

    fetch(baseurl)
        .then(response => response.json())
        .then(data => geocodeResults(data))
}

function geocodeResults(data) {
    let lat = data[0].lat;
    let lon = data[0].lon;
    let displayName = data[0].display_name;

    console.log(lon, lat, displayName)

    searchResults(lon, lat, displayName);


}

function searchBtn() {
    let searchQuery = $("#locationSearch").val()
    fetchGeocode(searchQuery)
}

// Get the input field
var input = document.getElementById("locationSearch");

// Execute a function when the user releases a key on the keyboard
input.addEventListener("keyup", function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("searchBtn").click();
    }
});


function searchResults(lon, lat, displayName) {
    center = [lon, lat]
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

    $('#intro').hide(500)
    $('#results').show(500)
    $('#surroundingAmenities').show(500)

    map.getSource('points').setData(data);
    drawCircle();
    document.getElementById('placeCoord').innerHTML = displayName;
    withinData();
    measureDistance()
    updateLen()
    mapZoom()
    checkOverview()
    $("#locationSearch").val("")
}