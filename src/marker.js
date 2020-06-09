import $ from 'jquery';
import * as L from 'leaflet';

export function createMarkerButton(leafletMap, parent, popup, latlng) {
  const addMarkerButton = L.DomUtil.create('button', 'btn btn-primary btn-sm mr-2', parent);
  addMarkerButton.textContent = 'Set marker';
  addMarkerButton.onclick = () => {
    const marker = L.marker(latlng).addTo(leafletMap);
    popup.remove();
    addDeleteToMarker(marker);
  };

  return addMarkerButton;
}

export function createTextButton(leafletMap, parent, popup, latlng) {
  const addTextButton = L.DomUtil.create('button', 'btn btn-primary btn-sm', parent);
  addTextButton.textContent = 'Set text';
  addTextButton.onclick = () => {
    $('#newTextModal')
      .modal('show')
      .on('hide.bs.modal', () => popup.remove());

    function submitHandler(e) {
      e.preventDefault();
      const markerText = document.querySelector('#markerText');
      const markerTextSize = document.querySelector('#markerTextSize');
      const icon = L.divIcon({ html: markerText.value, className: `w-100 h-100 h${7 - markerTextSize.value}` });
      const marker = L.marker(latlng, { icon }).addTo(leafletMap);
      addDeleteToMarker(marker);
      $('#newTextModal').modal('hide');
      popup.remove();
      textMarkerForm.removeEventListener('submit', submitHandler);
    }

    const textMarkerForm = document.querySelector('#textMarkerForm');
    textMarkerForm.addEventListener('submit', submitHandler);
  };

  return addTextButton;
}

function addDeleteToMarker(marker) {
  const deleteMarkerButton = L.DomUtil.create('button', 'btn btn-primary btn-sm');
  deleteMarkerButton.textContent = 'Remove';
  deleteMarkerButton.onclick = () => marker.remove();

  marker.bindPopup(deleteMarkerButton);
  marker.onclick = () => marker.openPopup();
}
