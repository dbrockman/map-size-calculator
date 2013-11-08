google.maps.event.addDomListener(window, 'load', function () {

  var map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 3,
    center: new google.maps.LatLng(50, 0),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  // window.map = map;

  var rectangle;
  var node_results_zoom = $('#results-zoom');
  var node_results_rect = $('#results-rect');
  var node_input_zoom_min = $('#min_zoom input');
  var node_input_zoom_max = $('#max_zoom input');

  google.maps.event.addListener(map, 'zoom_changed', show_zoom);

  function makeRectangle(bounds) {
    rectangle = new google.maps.Rectangle({
      map: map,
      bounds: bounds,
      editable: true,
      draggable: true,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35
    });
    google.maps.event.addListener(rectangle, 'bounds_changed', function () {
      show_results();
    });
    show_results();
    // window.rectangle = rectangle;
  }

  $('#btn-trapezium').click(function () {
    var bounds = map.getBounds();
    bounds = resizeBounds(bounds);
    if (rectangle) {
      rectangle.setBounds(bounds);
    } else {
      makeRectangle(bounds);
    }
  });

  $('input.zoom').on('change', show_results);

  function resizeBounds(bounds) {
    var center = bounds.getCenter();
    var span = bounds.toSpan();
    var offset = Math.min(span.lat(), span.lng());
    offset = offset / 4;
    var sw = new google.maps.LatLng(center.lat() - offset, center.lng() - offset);
    var ne = new google.maps.LatLng(center.lat() + offset, center.lng() + offset);
    return new google.maps.LatLngBounds(sw, ne);
  }

  function show_zoom() {
    node_results_zoom.text('Current Map Zoom: ' + map.zoom);
  }

  function show_results() {
    var minZoom = + node_input_zoom_min.val();
    var maxZoom = + node_input_zoom_max.val();
    minZoom = Math.min(Math.max(0, minZoom | 0), 21);
    maxZoom = Math.min(Math.max(minZoom, maxZoom | 0), 21);
    var text = [
      'Min Zoom: ' + minZoom,
      'Max Zoom: ' + maxZoom,
    ];
    if (rectangle) {
      var rb = rectangle.getBounds();
      var ne = rb.getNorthEast();
      var sw = rb.getSouthWest();
      var count = countTilesInRegion(ne, sw, minZoom, maxZoom);
      var bytes = estimateSize(count);
      text.push(
        'NE Lat: ' + ne.lat(),
        'NE Lng: ' + ne.lng(),
        'SW Lat: ' + sw.lat(),
        'SW Lng: ' + sw.lng(),
        'Tiles: ' + count,
        'Estimated Size: ' + humanizeBytes(bytes),
        'Estimated Size @2x: ' + humanizeBytes(bytes * 2)
      );
    }
    node_results_rect.text(text.join('\n'));
  }

  function countTilesInRegion(northEast, southWest, minZoom, maxZoom) {
    var minLat = southWest.lat();
    var maxLat = northEast.lat();
    var minLon = southWest.lng();
    var maxLon = northEast.lng();

    var zoom, n, xMin, yMax, xMax, yMin;

    var result = 0;

    minZoom = minZoom < 0 ? 0 : minZoom | 0;
    maxZoom = maxZoom < 0 ? 0 : maxZoom | 0;

    if (maxZoom < minZoom || maxLat <= minLat || maxLon <= minLon)
      return 0;

    for (zoom = minZoom; zoom <= maxZoom; zoom++) {
      n = Math.pow(2, zoom);
      xMin = Math.floor(((minLon + 180) / 360) * n);
      yMax = Math.floor((1 - (Math.log(Math.tan(minLat * Math.PI / 180) + 1 / Math.cos(minLat * Math.PI / 180)) / Math.PI)) / 2 * n);
      xMax = Math.floor(((maxLon + 180) / 360) * n);
      yMin = Math.floor((1 - (Math.log(Math.tan(maxLat * Math.PI / 180) + 1 / Math.cos(maxLat * Math.PI / 180)) / Math.PI)) / 2 * n);

      result += (xMax + 1 - xMin) * (yMax + 1 - yMin);
    }
    return result;
  }

  function estimateSize(numberOfTiles) {
    // -- SELECT AVG(LENGTH(tile_data)) as avg_img_size FROM images
    var avg_img_size = 13157.3491246138;
    var b = numberOfTiles * avg_img_size;
    return b;
  }

  function humanizeBytes(b) {
    var k = 1000;
    var m = k * k;
    var g = m * k;
    var t = g * k;
    var p = t * k;
    var MAX_INT = 0x20000000000000;
    b = b < MAX_INT ? b : MAX_INT;
    if (b >= p) return round(b / p) + ' PB';
    if (b >= t) return round(b / t) + ' TB';
    if (b >= g) return round(b / g) + ' GB';
    if (b >= m) return round(b / m) + ' MB';
    if (b >= k) return round(b / k) + ' kB';
    return round(b) + ' B';
  }

  function round(n) {
    return Math.round(n * 100) / 100;
  }

  show_zoom();
  show_results();
});
