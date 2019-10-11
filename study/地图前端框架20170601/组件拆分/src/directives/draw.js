/*
 * 绘制
 * openlayers的interaction.draw点线面
 * 与plot有重复的功能
 * Point, LineString[是否自由绘制], Polygon[是否自由绘制], Circle, Square, Box, Star
 */
angular.module('openlayers-directive').directive('olDraw', ["$log", "$q", "olMapDefaults", "$interval", "olHelpers", "$compile", function ($log, $q, olMapDefaults, $interval, olHelpers, $compile) {
    return {
        restrict: 'E',
        require: '^openlayers',
        scope: {
            type: "="
        },
        link: function (scope, element, attrs, controller) {
            var drawOverlay, draw, free = false;
            olScope.getMap().then(function (map) {
                var features = new ol.Collection();
                var featureOverlay = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        features: features
                    })
                });
                map.addLayer(featureOverlay);

                function addInteraction() {
                    map.removeInteraction(draw);
                    draw = new ol.interaction.Draw({
                        features: features,
                        type: /** @type {ol.geom.GeometryType} */ (scope.type),
                        freehand: free
                    });
                    draw.on('drawend', onDrawEnd);
                    map.addInteraction(draw);
                }

                function onDrawEnd(event) {

                }

                scope.$watch("type", function (nval) {
                    if (nval) {
                        addInteraction();
                    }
                });
            });
        }
    }
}]);
