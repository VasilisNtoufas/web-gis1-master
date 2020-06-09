import shp from 'shpjs';

export class GeoJsonService {

    data(data) {
        return shp(data).catch(() => alert('Error trying to parse SHP file'));
    }

}
