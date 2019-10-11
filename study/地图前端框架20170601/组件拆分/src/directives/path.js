angular.module('openlayers-directive').directive('olPath', ["$log", "$q", "olMapDefaults", "olHelpers", function ($log, $q, olMapDefaults, olHelpers) {

    return {
        restrict: 'E',
        scope: {
            style: '=olStyle'
        },
        require: '^openlayers',
        replace: true,
        template: '<div class="popup-label path" ng-bind-html="message"></div>',

        link: function (scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var createFeature = olHelpers.createFeature;
            var createOverlay = olHelpers.createOverlay;
            var createVectorLayer = olHelpers.createVectorLayer;
            var insertLayer = olHelpers.insertLayer;
            var removeLayer = olHelpers.removeLayer;
            var olScope = controller.getOpenlayersScope();
            var label;

            olScope.getMap().then(function (map) {
                var mapDefaults = olMapDefaults.getDefaults(olScope);
                // var viewProjection = mapDefaults.view.projection;
                var viewProjection = map.getView().getProjection().getCode();

                var layer = createVectorLayer(attrs.zindex || 0);
                var layerCollection = map.getLayers();

                insertLayer(layerCollection, layerCollection.getLength(), layer);

                scope.$on('$destroy', function () {

                    // removeLayer(layerCollection, layer.index);
                    map.removeLayer(layer);
                    map.removeOverlay(label);
                });

                if (isDefined(attrs.coords)) {
                    var proj = attrs.projection || 'EPSG:4326';
                    var coords = JSON.parse(attrs.coords);
                    var radius = parseFloat(attrs.radius) || 0;

                    /*xiarx 20161120 添加线的绘制  type种类Point, LineString, MultiLineString, Polygon，Circle*/
                    var type = attrs.type ? attrs.type : 'Polygon';
                    var defaultStyle = mapDefaults.styles.path;

                    if (type == "Point") {
                        defaultStyle = mapDefaults.styles.feature;
                    }
                    if (radius != 0) {
                        var getGeodesicDistance = olHelpers.getGeodesicDistance;
                        var perDegree = getGeodesicDistance(proj, coords, [coords[0] + 1, coords[1]]);
                        radius = radius / perDegree;
                    }
                    var data = {
                        type: type,
                        coords: coords,
                        radius: radius,
                        projection: proj,
                        style: scope.style ? scope.style : defaultStyle
                    };
                    var feature = createFeature(data, viewProjection);
                    layer.getSource().addFeature(feature);

                    if (attrs.message) {
                        scope.message = attrs.message;
                        var extent = feature.getGeometry().getExtent();
                        label = createOverlay(element, extent);
                        map.addOverlay(label);
                    }
                    return;
                }
            });
        }
    };
}]);
