angular.module('openlayers-directive').directive('olControl', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function ($log, $q, olData, olMapDefaults, olHelpers) {

    return {
        restrict: 'E',
        scope: {
            properties: '=olControlProperties'
        },
        replace: false,
        require: '^openlayers',
        link: function (scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var olScope = controller.getOpenlayersScope();
            var olControl;
            var olControlOps;

            olScope.getMap().then(function (map) {
                var getControlClasses = olHelpers.getControlClasses;
                var controlClasses = getControlClasses();

                scope.$on('$destroy', function () {
                    map.removeControl(olControl);
                });

                if (!isDefined(scope.properties) || !isDefined(scope.properties.control)) {
                    if (attrs.name) {
                        if (isDefined(scope.properties)) {
                            olControlOps = angular.copy(scope.properties);

                            if (attrs.name == "overviewmap") { //鹰眼
                                var layers = [];
                                olControlOps.layers.forEach(function (layer) {
                                    layers.push(
                                        new ol.layer.Tile({
                                            source: new ol.source[layer.source.type]({
                                                url: layer.source.url
                                            })
                                        })
                                    )
                                });
                                olControlOps.layers = layers;

                            }
                        }
                        olControl = new controlClasses[attrs.name](olControlOps);
                        map.addControl(olControl);
                    }
                    return;
                }

                olControl = scope.properties.control;
                map.addControl(olControl);
            });
        }
    };
}]);