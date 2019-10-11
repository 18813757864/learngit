/*
 * 周边范围
 * xiarx 20170508
 */
angular.module('openlayers-directive').directive('olNearby', ["$log", "$q", "olMapDefaults", "olHelpers", function ($log, $q, olMapDefaults, olHelpers) {

    return {
        restrict: 'E',
        scope: {
            coords: '=',
            radius: '=',
            refreshData: '&'
        },
        require: '^openlayers',
        replace: true,
        template: '<div class="nearby-control-point"><a></a><label ng-click="editDis($event)"><span ng-bind="radius" ng-hide="edit"></span>' +
            '<input ng-model="radius" ng-show="edit" />m</label></div>',
        link: function (scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var createFeature = olHelpers.createFeature;
            var createOverlay = olHelpers.createOverlay;
            var createVectorLayer = olHelpers.createVectorLayer;
            var getGeodesicDistance = olHelpers.getGeodesicDistance;
            var olScope = controller.getOpenlayersScope();
            var label, mapCoord, isDrag = false,
                feature;
            scope.edit = false;

            olScope.getMap().then(function (map) {
                scope.$on('$destroy', function () {
                    map.removeLayer(layer);
                    map.removeOverlay(label);
                });

                var layer = createVectorLayer(attrs.zindex || 0);
                map.addLayer(layer);
                var viewProjection = map.getView().getProjection().getCode();
                var proj = attrs.projection || 'EPSG:4326';

                var style = {
                    fill: {
                        color: [110, 162, 228, 0.3]
                    },
                    stroke: {
                        width: 1,
                        color: [110, 162, 228]
                    }
                }

                function initMap() {
                    mapCoord = ol.proj.transform(scope.coords, proj, viewProjection); //圆心坐标
                    if (scope.radius) {
                        var perDegree = getGeodesicDistance(viewProjection, mapCoord, [mapCoord[0] + 1, mapCoord[1]]);
                        var radius = scope.radius / perDegree;
                    }
                    var data = {
                        type: "Circle",
                        coords: mapCoord,
                        radius: radius,
                        projection: viewProjection,
                        style: style
                    };
                    feature = createFeature(data, viewProjection);
                    layer.getSource().addFeature(feature);
                    //适应屏幕
                    var extent = layer.getSource().getExtent();
                    map.getView().fit(extent, {
                        size: map.getSize(),
                        padding: [15, 15, 15, 15],
                        duration: 1000
                    });

                    //overlay的位置，先进行坐标系转换
                    var pos = [mapCoord[0] + radius, mapCoord[1]];
                    label = createOverlay(element, pos);
                    map.addOverlay(label);
                }

                initMap();
                scope.$watch("coords", function (n, o) {
                    if (n && n.length == 2) {
                        initMap();
                    }
                });
                //鼠标拖动事件
                function windowToCanvas(canvas, x, y) {
                    var bbox = canvas.getBoundingClientRect();
                    return [x - bbox.left - (bbox.width - $(canvas).width()) / 2, y - bbox.top - (bbox.height - $(canvas).height()) / 2];
                }
                var obj = $(".nearby-control-point>a");
                obj.on("mousedown", function (e) {
                    var preRadius = feature.getGeometry().getRadius();
                    var prePos = label.getPosition();
                    var downPos = map.getCoordinateFromPixel(windowToCanvas(map.getViewport(), e.clientX, e.clientY));
                    $(map.getViewport()).on("mousemove", function (e) {
                        isDrag = true;
                        var coordinate = map.getCoordinateFromPixel(windowToCanvas(map.getViewport(), e.clientX, e.clientY));
                        label.setPosition([prePos[0] + coordinate[0] - downPos[0], mapCoord[1]]);

                        var nowRadius = Math.abs(coordinate[0] - downPos[0] + preRadius);
                        feature.getGeometry().setRadius(nowRadius);
                        var radiusDis = getGeodesicDistance(viewProjection, mapCoord, [mapCoord[0] + nowRadius, mapCoord[1]]);
                        scope.radius = parseInt(radiusDis);
                        scope.$apply();
                        return false;
                    });
                    $(map.getViewport()).on("mouseup", function (e) {
                        //适应屏幕
                        var extent = layer.getSource().getExtent();
                        map.getView().fit(extent, {
                            size: map.getSize(),
                            padding: [5, 5, 5, 5],
                            duration: 1000
                        });
                        label.setPosition([mapCoord[0] + feature.getGeometry().getRadius(), mapCoord[1]]);
                        $(map.getViewport()).off("mousemove");
                        $(map.getViewport()).off("mouseup");
                        scope.refreshData();
                        scope.$apply();
                        isDrag = false;
                        return false;
                    });
                });

                scope.editDis = function (e) {
                    if (isDrag) {
                        return;
                    }
                    scope.edit = true;
                    e.stopPropagation();
                    $(map.getViewport()).on("mousedown", function (e) {
                        if (scope.edit && e.target.tagName.toLowerCase() != "input") {
                            scope.edit = false;
                            radius = scope.radius / perDegree;
                            feature.getGeometry().setRadius(radius);
                            label.setPosition([mapCoord[0] + radius, mapCoord[1]]);
                            //适应屏幕
                            var extent = layer.getSource().getExtent();
                            map.getView().fit(extent, {
                                size: map.getSize(),
                                padding: [5, 5, 5, 5],
                                duration: 1000
                            });
                            $(map.getViewport()).off("mousedown");
                            scope.$apply();
                        }
                    });
                }
            });
        }
    }
}]);
