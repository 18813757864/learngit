/* author xiarx 20170420
 * heatmap  热力图
 */
angular.module('openlayers-directive').directive('olHeatMap', ["$log", "$q", "olMapDefaults", "olHelpers", function ($log, $q, olMapDefaults, olHelpers) {

    return {
        restrict: 'E',
        scope: {
            points: '=points'
        },
        require: '^openlayers',
        link: function (scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var olScope = controller.getOpenlayersScope();
            var createStyle = olHelpers.createStyle;
            var createFeature = olHelpers.createFeature;

            olScope.getMap().then(function (map) {
                var heatLayer = new ol.layer.Heatmap({
                    source: new ol.source.Vector(),
                    blur: parseInt(attrs.blur, 10) || 15,
                    radius: parseInt(attrs.radius, 10) || 5,
                    zIndex: parseInt(attrs.zindex, 10) || 0
                });
                heatLayer.set('heat', true);
                map.addLayer(heatLayer);

                var projection = attrs.projection ? attrs.projection : "EPSG:4326";
                var viewProjection = map.getView().getProjection().getCode();

                scope.$watch("points", function (nVal, oVal) {
                    if (nVal) {
                        var count = nVal.length;
                        var features = new Array();

                        for (var i = 0; i < count; i++) {
                            var point = nVal[i];
                            if (point.lon && point.lat) {
                                var feature = createFeature({
                                    projection: projection,
                                    lat: parseFloat(point.lat),
                                    lon: parseFloat(point.lon),
                                    id: point.id
                                }, viewProjection);
                                features.push(feature);

                                feature.set("featureInfo", {
                                    type: "heatFeature",
                                    data: {}
                                });

                            }
                        }

                        heatLayer.getSource().clear(true);
                        heatLayer.getSource().addFeatures(features);


                    }
                }, true);

                scope.$on('$destroy', function () {
                    map.removeLayer(heatLayer);
                });

            });
        }
    }
}]);
