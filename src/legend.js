import * as L from 'leaflet';

export class Legend {

  constructor(map) {
    this.legendControl = L.control({ position: 'bottomright' });
    const legendContainer = L.DomUtil.create('div', 'info legend');
    legendContainer.innerHTML = '<h4>Legend</h4>';
    this.legend = L.DomUtil.create('ul', 'list-unstyled', legendContainer);
    this.legendControl.onAdd = () => legendContainer;
    this.map = map;
    this.legends = [];
  }

  addLegend(values) {
    values.forEach(value => {
      this.legends.push(value);
      const li = L.DomUtil.create('li', value.type === 'Point' ? 'legend-point' : 'LineString' ? 'legend-line' : null, this.legend);
      li.innerHTML = `<span style="cursor: pointer"><i style="background-color: ${value.color}"></i> ${value.text}</span>`;
      li.onclick = e => {
        e.stopPropagation();
        li.classList.toggle('text-muted');

        if (value.onClick) {
          value.onClick();
        }
      };
    });

    if (!this.legendControl.getContainer()) {
      this.legendControl.addTo(this.map);
    }
  }

}
