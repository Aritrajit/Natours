/*eslint-disable*/

export const displayMap = (locations) => {

    mapboxgl.accessToken= 'pk.eyJ1IjoiYXJpdHJhMDA3IiwiYSI6ImNsajA4d2N0dTBwa3ozZXM5OHR1eGdoY2oifQ.lZP6nmlIZ1tKv2Vxppf_tA';

    var map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/aritra007/clj09c5po001801miffhdbm5g', // style URL
        scrollZoom: false
        // center: [-118.113491, 34.111745], // starting position [lng, lat]
        // zoom: 10, // starting zoom
        // interactive : false

    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        //Create marker
        const el = document.createElement('div');
        el.className = 'marker';
        
        //Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);

        //Add popup
        new mapboxgl.Popup({
            offset:30
        }).setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`)
            .addTo(map);

        //Extends the map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds , {
            padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
            
        }
    });
}

