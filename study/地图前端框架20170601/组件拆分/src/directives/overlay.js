/* author xiarx 20161108
 * overlay
 */
angular.module('openlayers-directive').directive('olOverlay', ["$log", "$sce", "$compile", "olMapDefaults", "olHelpers", function ($log, $sce, $compile, olMapDefaults, olHelpers) {
    return {
        restrict: 'E',
        scope: {
            coord: '=coord',
            label: '=label'
        },
        require: '^openlayers',
        link: function (scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var olScope = controller.getOpenlayersScope();
            var createOverlay = olHelpers.createOverlay;
            var setOverlay = olHelpers.setMarkerEvent;

            var label;
            if (!attrs.projection) {
                attrs.projection = "EPSG:4326";
            }
            var data = {
                projection: attrs.projection,
                coord: scope.coord,
                label: scope.label
            }

            olScope.getMap().then(function (map) {
                scope.changeProperty = function () {
                    if (isDefined(scope.coord)) {
                        if (!label) {
                            if (attrs.templateurl) {
                                $.get(attrs.templateurl, function (response) {
                                    data.label.message = response;
                                    label = setOverlay(null, map, data, scope.$parent);
                                });
                            }
                        } else {
                            map.removeOverlay(label);
                            label = setOverlay(null, map, data, scope.$parent);
                        }
                    } else {
                        console.log("coord不存在");
                    }
                }
                scope.$watch('coord', function (nVal, oVal) {
                    if (!angular.equals(nVal, oVal)) {
                        data.coord = scope.coord;
                        scope.changeProperty();
                    }
                });
                scope.$watch('label', function (nVal, oVal) {
                    if (!angular.equals(nVal, oVal)) {
                        data.label = scope.label;
                        scope.changeProperty();
                    }
                }, true);


                scope.$on('$destroy', function () {
                    if (label) {
                        map.removeOverlay(label);
                    }
                });
            });

        }
    }
}]);