import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

import $ from 'jquery';

import { MapService } from './map.service';
import { ShpForm } from './shp.form';
import { TitleForm } from './title.form';

const mapService = new MapService();
new TitleForm(values => mapService.updateTitle(values));

$('#newFileModal').on('shown.bs.modal', () => new ShpForm(mapService));
