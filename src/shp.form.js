import $ from 'jquery';
import * as L from 'leaflet';
import * as colorbrewer from 'colorbrewer';

import { GeoJsonService } from './geojson.service';
import { setProgress } from './progress.service';

export class ShpForm {

    constructor(mapService) {
        this.shpForm = document.getElementById('shpForm');
        this.shpFileInput = document.getElementById('shpFile');
        this.shpFileNameInput = document.getElementById('shpTitle');
        this.colorInput = document.getElementById('shpColor');
        this.submitHandler = this.onShpFormSubmit.bind(this);
        this.shpForm.addEventListener('submit', this.submitHandler);
        this.mapService = mapService;
        this.geoJsonService = new GeoJsonService();
        this.classificationForm = document.getElementById('classificationForm');
        this.classPropertyInput = document.getElementById('classProperty');
        this.classCountInput = document.getElementById('classCount');
        this.classColorPatternInput = document.getElementById('classColorPattern');
        this.classFieldset = document.getElementById('classFieldset');
    }

    onShpFormSubmit(e) {
        e.preventDefault();
        const file = this.shpFileInput.files[0];

        if (file && file.name.endsWith('.zip')) {
            $('#newFileModal').modal('hide');
            this.handleZipFile(file);
            this.shpFileInput.classList.remove('is-invalid');
        } else {
            this.shpFileInput.classList.add('is-invalid');
        }

        this.shpForm.removeEventListener('submit', this.submitHandler);
    }

    handleZipFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.readyState === FileReader.DONE && !reader.error) {
                this.geoJsonService.data(reader.result)
                    .then(geoJson => this.displayGeoJson(geoJson, this.shpFileNameInput.value || file.name.split('.')[0]));
            }
        };
        reader.addEventListener('progress', event => setProgress(event.loaded, event.total));
        reader.readAsArrayBuffer(file);
    }

    displayGeoJson(geoJson, name) {
        setProgress(100);

        console.log(geoJson);

        const isMultiPolygon = geoJson.features[0].geometry.type === 'MultiPolygon';
        const hasNumericProperties = Object.values(geoJson.features[0].properties).some(property => typeof property === 'number');

        if (isMultiPolygon && hasNumericProperties) {
            this.askForDensityGraph(geoJson).then(
                ({ geoJson: updatedGeoJson, legend }) => this.mapService.loadGeoJson(updatedGeoJson, legend),
                () => this.loadSimpleGeoJson(geoJson, name),
            );
        } else {
            this.loadSimpleGeoJson(geoJson, name);
        }
    }

    loadSimpleGeoJson(geoJson, name) {
        this.mapService.loadGeoJson(geoJson, [{ text: `<strong>${name}</strong>`, color: this.colorInput.value }]);
    }

    askForDensityGraph(geoJson) {
        return new Promise((resolve, reject) => {
            colorbrewer.schemeGroups.singlehue.forEach(hue => {
                const option = L.DomUtil.create('option', null, this.classColorPatternInput);
                option.setAttribute('value', hue);
                option.innerHTML = hue.substring(0, hue.length - 1);
            });
            Object.entries(geoJson.features[0].properties)
                .filter(([, value]) => typeof value === 'number')
                .map(([property]) => {
                    const option = L.DomUtil.create('option', null, this.classPropertyInput);
                    option.innerHTML = property;
                })

            this.classColorPatternInput.value = colorbrewer.schemeGroups.singlehue[0];
            this.classColorPatternInput.addEventListener(
                'input',
                () => this.classFieldset.querySelectorAll('input[type=color]')
                    .forEach((colorInput, index) => colorInput.value = this.getColorbrewerColor(index))
            );

            this.classCountInput.addEventListener('input', () => this.onClassCountChange());
            this.classCountInput.setAttribute('value', 1);
            this.onClassCountChange();

            document.querySelectorAll('#classificationModal button[data-dismiss="modal"]')
                .forEach(button => button.addEventListener('click', () => reject()));

            $('#classificationModal').modal('show');

            this.classificationForm.addEventListener('submit', e => {
                e.preventDefault();
                $('#classificationModal').modal('hide');
                const legend = this.createClassLegend(geoJson, this.classPropertyInput.value);
                const updatedGeoJson = this.colorize(geoJson, this.classPropertyInput.value, legend);

                resolve({ geoJson: updatedGeoJson, legend });
            });
        });
    }

    createClassInput(id) {
        const formGroup = L.DomUtil.create('div', 'form-group');
        const nameElementId = `class${id}Name`;
        const label = L.DomUtil.create('label', null, formGroup);
        label.setAttribute('for', nameElementId);
        label.textContent = 'Class name';
        const input = L.DomUtil.create('input', 'form-control', formGroup);
        input.setAttribute('type', 'text');
        input.setAttribute('name', nameElementId);
        input.setAttribute('id', nameElementId);

        return formGroup;
    }

    onClassCountChange() {
        if (!this.classCountInput.checkValidity()) {
            return;
        }

        const classCountInputValue = Number(this.classCountInput.value);
        const currentClassCount = this.classFieldset.querySelectorAll('.row').length;

        for (let i = 0; i < currentClassCount - classCountInputValue; i++) {
            this.classFieldset.removeChild(this.classFieldset.lastElementChild);
        }

        for (let i = 0; i < classCountInputValue - currentClassCount; i++) {
            const classRow = L.DomUtil.create('div', 'row');

            const itemNumber = currentClassCount + i;
            const nameFormGroup = this.createClassInput(itemNumber);
            const colorFormGroup = this.createClassColor(itemNumber, this.getColorbrewerColor(itemNumber));

            const nameFormCol = L.DomUtil.create('div', 'col-md-6', classRow);
            const colorFormCol = L.DomUtil.create('div', 'col-md-6', classRow);
            nameFormCol.appendChild(nameFormGroup);
            colorFormCol.appendChild(colorFormGroup);

            this.classFieldset.appendChild(classRow);
        }
    }

    createClassColor(id, startingColor = this.colorInput.value) {
        const formGroup = L.DomUtil.create('div', 'form-group');
        const colorElementId = `class${id}Color`;
        const label = L.DomUtil.create('label', null, formGroup);
        label.setAttribute('for', colorElementId);
        label.textContent = 'Class color';
        const input = L.DomUtil.create('input', 'form-control', formGroup);
        input.setAttribute('type', 'color');
        input.setAttribute('name', colorElementId);
        input.setAttribute('id', colorElementId);
        input.setAttribute('value', startingColor);

        return formGroup;
    }

    getColorbrewerColor(index) {
        const classCountInputValue = Number(this.classCountInput.value);
        const colorBrewerIndex = classCountInputValue > 2 ? classCountInputValue : 3;   // Colorbrewer has at minimum 3 groups

        return colorbrewer[this.classColorPatternInput.value][colorBrewerIndex][index];
    }

    createClassLegend(data, property) {
        data.features.sort((a, b) => a.properties[property] - b.properties[property]);

        return Array.from(this.classFieldset.querySelectorAll('.row'))
            .map((row, index, array) => {
                const getDataIndex = legendIndex => Math.floor(legendIndex * (data.features.length / array.length));
                const firstLegendFeature = data.features[getDataIndex(index)].properties[property];
                const lastLegendFeature = data.features[Math.min(getDataIndex(index + 1) - 1, data.features.length - 1)].properties[property];
                return {
                    text: `<strong>${row.querySelector('input[type=text]').value}</strong> (${firstLegendFeature} - ${lastLegendFeature})`,
                    color: row.querySelector('input[type=color]').value,
                };
            });
    }

    colorize(data, property, colors) {
        data.features.sort((a, b) => a.properties[property] - b.properties[property])
            .forEach((feature, index, array) => feature.properties.customColor = colors[Math.floor(index / (array.length / colors.length))]);

        return data;
    }

}
