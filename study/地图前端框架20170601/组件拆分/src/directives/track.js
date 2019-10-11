/* author xiarx 20170224
 * car point 都为marker对象
 * carProperties    lineProperties
 * pointProperties 应包含在points数组的每个对象里
 * curIndex  控制车辆的移动
 * range    控制要绘制的路线区间
 * points数组里的每个对象应包含lat,lon,pointProperties,timestamp
 * 若退出轨迹回放或者切换轨迹回放，直接销毁该指令清除轨迹
 */
angular.module('openlayers-directive').directive('olTrack', ["$log", "$q", "olMapDefaults", "$interval", "olHelpers", function ($log, $q, olMapDefaults, $interval, olHelpers) {
    return {
        restrict: 'E',
        require: '^openlayers',
        scope: {
            curIndex: '=curIndex',
            range: '=range',
            showRoute: '=showRoute'
        },
        transclude: true,
        replace: true,
        template: '<div><ol-marker ol-marker-properties="trackPoint" ng-repeat="trackPoint in carTrack.trackPoints"></ol-marker>' +
            '<ol-path coords="{{trackLine.coords}}" ol-style="trackLine.style" type="LineString" ng-repeat="trackLine in carTrack.trackLines"></ol-path>' +
            '<ol-marker ol-marker-properties="carTrack.car"></ol-marker>' +
            '<ol-path coords="{{carTrack.route.coords}}" ol-style="carTrack.route.style" type="MultiLineString" ng-if="showRoute"></ol-path></div>',
        link: function (scope, element, attrs, controller) {
            var olScope = controller.getOpenlayersScope();
            var isCenter = attrs.isCenter;
            var points = JSON.parse(attrs.points);
            var total = points.length;
            var interval = attrs.interval;
            var hisTimer;
            var projection = attrs.projection ? attrs.projection : "EPSG:4326";
            var exsitIndex = []; //已绘制过的路段不再绘制

            scope.carTrack = {
                car: {},
                trackPoints: [],
                trackLines: [],
                route: {
                    toShowLine: false,
                    coords: [],
                    style: JSON.parse(attrs.lineProperties).style
                }
            };

            if (attrs.carProperties) {
                angular.extend(scope.carTrack.car, JSON.parse(attrs.carProperties));
            }

            for (var i = 1; i < total; i++) {
                var line = [[parseFloat(points[i - 1].lon), parseFloat(points[i - 1].lat)], [parseFloat(points[i].lon), parseFloat(points[i].lat)]];

                scope.carTrack.route.coords.push(line);
            }

            olScope.getMap().then(function (map) {
                var mapDefaults = olMapDefaults.getDefaults(olScope);
                var viewProjection = mapDefaults.view.projection;
                var isDefined = olHelpers.isDefined;
                var getGreatCircleDistance = olHelpers.getGreatCircleDistance;

                scope.$on('$destroy', function () {
                    scope.curIndex = 0;
                    scope.range = [0, 0];
                    scope.carTrack.trackPoints = [];
                    scope.carTrack.trackLines = [];
                    scope.carTrack.route.coords = [];
                });



                //绘制某个点与其上个点之间的路段
                scope.drawRoute = function (index) {
                    if (index < 1 || index > total - 1) {
                        return;
                    }

                    //已绘制过的路段不再绘制
                    if (exsitIndex.indexOf(index) == -1) {
                        //节点的样式以及悬浮点击弹框可以由父级确定
                        scope.carTrack.trackPoints.push(points[index]);

                        //路线
                        var line = {};
                        if (attrs.lineProperties) {
                            line = JSON.parse(attrs.lineProperties);
                        }

                        if (!line.style) {
                            line.style = mapDefaults.styles.path;
                        }

                        line.coords = [[parseFloat(points[index - 1].lon), parseFloat(points[index - 1].lat)], [parseFloat(points[index].lon), parseFloat(points[index].lat)]];
                        line.projection = projection;

                        //更新轨迹样式，timestamp是以ms为单位
                        if (points[index].timestamp) {
                            var s = getGreatCircleDistance(projection, line.coords[1], line.coords[0]);
                            if (s > 34 * (points[index].timestamp - points[index - 1].timestamp) / 1000) { //最大速度设置为34m/s，间距过大，轨迹不真实，用虚线表现
                                line.style.stroke.lineDash = [4, 10];
                            } else {
                                if (isDefined(line.style.stroke.lineDash)) {
                                    delete line.style.stroke.lineDash;
                                }
                            }
                        }

                        scope.carTrack.trackLines.push(line);

                        exsitIndex.push(index);
                    }
                }

                //清除两点

                //绘制某一区间的路线
                scope.$watchCollection("range", function (nval, oval) {
                    var startIndex = parseInt(nval[0]);
                    var endIndex = parseInt(nval[1]);
                    for (var i = startIndex; i <= endIndex; i++) {
                        //绘制路线、节点
                        scope.drawRoute(i);
                    }
                });

                //在不同的节点，车辆有不同的方向
                scope.$watch("curIndex", function (nval, oval) {
                    if (nval < 0) {
                        return;
                    }
                    var markerStyle = scope.carTrack.car.style;
                    if (markerStyle && markerStyle.image && markerStyle.image.icon && markerStyle.image.icon.rotation != undefined) {
                        markerStyle.image.icon.rotation = points[nval].direction ? parseFloat(points[nval].direction) / 180 * Math.PI : 0;
                    }

                    //移动车辆
                    scope.carTrack.car.lat = points[nval].lat;
                    scope.carTrack.car.lon = points[nval].lon;
                    scope.carTrack.car.projection = projection;

                    //绘制路线、节点
                    scope.drawRoute(nval);


                    var requestedPosition;
                    if (projection === 'pixel') {
                        requestedPosition = [parseFloat(points[nval].lon), parseFloat(points[nval].lat)];
                    } else {
                        requestedPosition = ol.proj.transform([parseFloat(points[nval].lon), parseFloat(points[nval].lat)], projection, viewProjection);
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


                });
            });
        }
    }
            }]);
