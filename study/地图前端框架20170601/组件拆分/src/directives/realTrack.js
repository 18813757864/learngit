/* author xiarx 20170224
 * realtrack  实时跟踪  不绘制节点
 * carProperties    lineProperties
 * interval 时间间隔 以秒为单位
 * scope.carTrack = {
        car: {
            id: "",
            lat: 0,
            lon: 0,
            style: null,
            clickFunc: function () {}
        },
        trackLines: []
    }; 
 */
angular.module('openlayers-directive').directive('olRealtrack', ["$log", "$q", "olMapDefaults", "$compile", "olHelpers", function ($log, $q, olMapDefaults, $compile, olHelpers) {
    return {
        restrict: 'E',
        require: '^openlayers',
        scope: {
            properties: '=olRealtrackProperties',
            data: '=data'
        },
        transclude: true,
        replace: true,
        template: '<ol-path coords="trackLine.coords" ol-style="trackLine.style" type="LineString" ng-repeat="trackLine in carTrack.trackLines"></ol-path>' +
            '<ol-marker ol-marker-properties="carTrack.car"></ol-marker></div>',
        link: function (scope, element, attrs, controller) {
            var olScope = controller.getOpenlayersScope();
            var points = [];
            var projection = attrs.projection ? attrs.projection : "EPSG:4326";
            var getGreatCircleDistance = olHelpers.getGreatCircleDistance;
            var isDefined = olHelpers.isDefined;
            var isCenter = attrs.isCenter;

            scope.carTrack = {
                car: {},
                trackPoints: [],
                trackLines: []
            };
            angular.extend(scope.carTrack.car, JSON.parse(attrs.carProperties));

            olScope.getMap().then(function (map) {
                var mapDefaults = olMapDefaults.getDefaults(olScope);
                var viewProjection = mapDefaults.view.projection;

                //绘制某个点与其上个点之间的路段
                scope.drawRoute = function (index) {
                    if (index < 1 || index > total - 1) {
                        return;
                    }

                    //路线
                    var line = JSON.parse(attrs.lineProperties);
                    if (!line.style) {
                        line.style = mapDefaults.styles.path;
                    }

                    line.coords = [[parseFloat(points[index - 1].lon), parseFloat(points[index - 1].lat)], [parseFloat(points[index].lon), parseFloat(points[index].lat)]];
                    line.projection = projection;

                    //更新轨迹样式
                    var s = getGreatCircleDistance(line.coords[1][1], line.coords[1][0], line.coords[0][1], line.coords[0][0]);
                    if (attrs.interval && s > 34 * attrs.interval) { //最大速度设置为34m/s，间距过大，轨迹不真实，用虚线表现
                        line.style.stroke.lineDash = [4, 10];
                    } else {
                        if (isDefined(line.style.stroke.lineDash)) {
                            delete line.style.stroke.lineDash;
                        }
                    }

                    scope.carTrack.trackLines.push(line);
                }

                scope.$watch('data', function (properties) {
                    if (properties && properties.lat) {
                        points.push(properties);
                        var len = points.length;
                        scope.drawRoute(len - 1);

                        //移动车辆
                        var markerStyle = scope.carTrack.car.style;
                        if (markerStyle && markerStyle.image && markerStyle.image.icon && markerStyle.image.icon.rotation != undefined) {
                            markerStyle.image.icon.rotation = properties.direction ? parseFloat(properties.direction) / 180 * Math.PI : 0;
                        }
                        scope.carTrack.car.lat = properties.lat;
                        scope.carTrack.car.lon = properties.lon;
                        scope.carTrack.car.projection = projection;

                        var requestedPosition;
                        if (projection === 'pixel') {
                            requestedPosition = [parseFloat(properties.lon), parseFloat(properties.lat)];
                        } else {
                            requestedPosition = ol.proj.transform([parseFloat(properties.lon), parseFloat(properties.lat)], projection, viewProjection);
                        }

                        var view = map.getView();
                        if (isCenter) { //是否让车辆一直位于地图的中心
                            view.setCenter(requestedPosition);
                        } else { //若车辆跑到了可视范围之外，移动地图居中
                            var size = map.getSize();
                            var extent = view.calculateExtent(size);
                            if (!ol.extent.containsCoordinate(extent, requestedPosition)) {
                                view.setCenter(requestedPosition);
                            }
                        }
                    }
                }, true);
            });
        }
    }
}]);
