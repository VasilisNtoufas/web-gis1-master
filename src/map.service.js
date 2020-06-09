import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet.browser.print/dist/leaflet.browser.print.min';

import { Legend } from './legend';
import { createMarkerButton, createTextButton } from './marker';
import north from './north.png';

export class MapService {

    constructor() {
        this.leafletMap = L.map('map').setView([38.5698109, 23.6563387], 7);

        this.addAttribution();
        this.addScale();
        this.addNorth();
        this.addTitle();
        this.addLegend();
        this.addPrint();
        this.addOnClickListener();
    }

    addAttribution() {
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 18,
                attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
            }
        )
            .addTo(this.leafletMap);
    }

    addScale() {
        L.control.scale().addTo(this.leafletMap);
    }

    addLegend() {
        this.legend = new Legend(this.leafletMap);
    }

    addNorth() {
        const northControl = L.control();
        this.printNorthControl = L.control();
        let img;

        function onNorthAdd() {
            img = L.DomUtil.create('img', 'float-right');
            img.style.width = '150px';
            img.setAttribute('src', north);

            return img;
        };
        northControl.onAdd = onNorthAdd;
        this.printNorthControl.onAdd = onNorthAdd;

        northControl.addTo(this.leafletMap);
    }

    addPrint() {
        L.control.browserPrint().addTo(this.leafletMap);
        this.leafletMap.on('browser-print-start', e => {
            this.printNorthControl.addTo(e.printMap);
            const printLegend = new Legend(e.printMap);
            this.legend.legends.forEach(mapLegend => printLegend.addLegend(mapLegend));
            const printTitle = L.control({ position: 'topright' });
            printTitle.onAdd = () => this.titleDiv;
            printTitle.addTo(e.printMap);
            printTitle.getContainer().parentElement.classList.add('text-center', 'w-100', 'd-flex', 'align-items-start', 'justify-content-end');
            L.control.scale().addTo(e.printMap);
        });
    }

    addTitle() {
        const titleControl = L.control({ position: 'topright' });
        this.titleDiv = L.DomUtil.create('div', 'w-25 mx-auto text-center position-absolute');
        this.titleDiv.style.left = 0;
        this.titleDiv.style.top = 0;
        this.titleDiv.style.right = 0;

        titleControl.onAdd = () => this.titleDiv;
        titleControl.addTo(this.leafletMap);
        titleControl.getContainer().parentElement.classList.add('text-center', 'w-100', 'd-flex', 'align-items-start', 'justify-content-end');
    }

    updateTitle({ text, size, color }) {
        this.titleDiv.innerText = text;
        this.titleDiv.style.fontSize = `${size}px`;
        this.titleDiv.style.color = color;
    }

    addOnClickListener() {
        this.leafletMap.on('click', e => {
            const popup = L.popup();
            const popupContent = L.DomUtil.create('div');
            createMarkerButton(this.leafletMap, popupContent, popup, e.latlng);
            createTextButton(this.leafletMap, popupContent, popup, e.latlng);

            popup.setLatLng(e.latlng)
                .setContent(popupContent)
                .openOn(this.leafletMap);
        });
    }

    loadGeoJson(geoJson, legendEntries) {
        const isSingleLayer = geoJson.features.length > 0 && !geoJson.features[0].properties.customColor;
        const layerExcludedColors = new Set();

        const mapGeoJson = L.geoJSON(
            geoJson,
            {
                style: feature => ({ color: isSingleLayer ? legendEntries[0].color : feature.properties.customColor.color }),
                filter: feature => isSingleLayer || !layerExcludedColors.has(feature.properties.customColor.color),
            }
        )
            .bindPopup(layer => `<dl>${Object.entries(layer.feature.properties)
                .map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)}</dl>`)
            .addTo(this.leafletMap);

        this.leafletMap.fitBounds(mapGeoJson.getBounds());
        this.legend.addLegend(legendEntries.map(entry => ({
            color: entry.color,
            text: entry.text,
            type: geoJson.features[0].geometry.type,
            onClick: () => {
                if (isSingleLayer) {
                    if (this.leafletMap.hasLayer(mapGeoJson)) {
                        mapGeoJson.remove();
                    } else {
                        mapGeoJson.addTo(this.leafletMap);
                    }
                } else {
                    if (layerExcludedColors.has(entry.color)) {
                        layerExcludedColors.delete(entry.color);
                    } else {
                        layerExcludedColors.add(entry.color);
                    }

                    mapGeoJson.clearLayers();
                    mapGeoJson.addData(geoJson);
                }
            }
        })));

        if (isSingleLayer) {
            mapGeoJson.setStyle({ color: legendEntries[0].color });
        }
    }

}
