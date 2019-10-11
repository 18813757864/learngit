/*
 * xiarx 20161230
 * olmarker指令代码整理
{
    id: marker.ID,
    lat: marker.LATITUDE,
    lon: marker.LONGITUDE,
    overLabel: {    //悬浮显示的信息
        message: '<div style="white-space:nowrap;">'+marker.NAME+'</div>',
        classNm: "markerOver",
        placement: "right"
    },
    clickLabel: {    //点击显示的信息
        id: marker.ID,
        title: marker.NAME,
        url: device.popUrl,
        classNm: classNm,
        placement: "top",
        keepOneOverlayVisible: true      //是否只显示一个弹出框
    },
    label: {         //直接显示的信息
        message: '',
        show: false
    },
    style: {
         image: {
             icon: {
                 anchor: [0.5, 1],
                 color: sColorChange,
                 opacity: 0.7,
                 src: 'images/locate.png'
             }
         }
    }
}
 */
angular.module('openlayers-directive').directive('olMarker', ["$log", "$q", "olMapDefaults", "olHelpers", function ($log, $q, olMapDefaults, olHelpers) {

    var getMarkerDefaults = function () {
        return {
            id: "",
            projection: 'EPSG:4326',
            lat: 0,
            lon: 0,
            coord: [],
            show: true,
            showOnMouseOver: false,
            showOnMouseClick: false,
            keepOneOverlayVisible: true,
            ngClick: false,
            clickLabel: {},
            overLabel: {},
            info: {}
        };
    };

    var markerLayerManager = (function () {
        var mapDict = [];

        function getMapIndex(map) {
            return mapDict.map(function (record) {
                return record.map;
            }).indexOf(map);
        }

        return {
            getInst: function getMarkerLayerInst(scope, map) {
                var mapIndex = getMapIndex(map);

                if (mapIndex === -1) {
                    var markerLayer = olHelpers.createVectorLayer();
                    markerLayer.set('markers', true);
                    map.addLayer(markerLayer);
                    mapDict.push({
                        map: map,
                        markerLayer: markerLayer,
                        instScopes: []
                    });
                    mapIndex = mapDict.length - 1;
                }

                mapDict[mapIndex].instScopes.push(scope);

                return mapDict[mapIndex].markerLayer;
            },
            deregisterScope: function deregisterScope(scope, map) {
                var mapIndex = getMapIndex(map);
                if (mapIndex === -1) {
                    throw Error('This map has no markers');
                }

                var scopes = mapDict[mapIndex].instScopes;
                var scopeIndex = scopes.indexOf(scope);
                if (scopeIndex === -1) {
                    throw Error('Scope wan\'t registered');
                }

                scopes.splice(scopeIndex, 1);

                if (!scopes.length) {
                    map.removeLayer(mapDict[mapIndex].markerLayer);
                    delete mapDict[mapIndex].markerLayer;
                    delete mapDict[mapIndex];
                }
            }
        };
    })();
    return {
        restrict: 'E',
        scope: {
            lat: '=lat',
            lon: '=lon',
            properties: '=olMarkerProperties',
            style: '=olStyle'
        },
        transclude: true,
        require: '^openlayers',
        replace: true,
        template: '<div class="popup-label marker">' +
            '<div ng-bind-html="message"></div>' +
            '<ng-transclude></ng-transclude>' +
            '</div>',

        link: function (scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var olScope = controller.getOpenlayersScope();
            var createFeature = olHelpers.createFeature;
            var createOverlay = olHelpers.createOverlay;
            var createStyle = olHelpers.createStyle;

            var hasTranscluded = element.find('ng-transclude').children().length > 0;

            olScope.getMap().then(function (map) {
                var markerLayer = markerLayerManager.getInst(scope, map);
                markerLayer.setZIndex(2);
                var data = getMarkerDefaults();

                var mapDefaults = olMapDefaults.getDefaults(olScope);
                // var viewProjection = mapDefaults.view.projection;
                var viewProjection = map.getView().getProjection().getCode();
                var label;
                var pos;
                var marker;

                scope.$on('$destroy', function () {
                    markerLayer.getSource().removeFeature(marker);
                    angular.forEach(map.getOverlays(), function (value) {
                        if (scope.properties.clickLabel && value.getId() == scope.properties.clickLabel.id) {
                            map.removeOverlay(value);
                        }
                    });
                    markerLayerManager.deregisterScope(scope, map);
                });

                //////一般不用这种方法定义marker，可以考虑移除///////////
                if (!isDefined(scope.properties)) {
                    data.lat = scope.lat ? scope.lat : data.lat;
                    data.lon = scope.lon ? scope.lon : data.lon;
                    data.message = attrs.message;
                    data.label = {
                        title: attrs.title ? attrs.title : "",
                        message: attrs.message ? attrs.message : "",
                        classNm: attrs.classNm ? attrs.classNm : "",
                        placement: attrs.placement ? attrs.placement : "top"
                    };
                    data.style = scope.style ? scope.style : mapDefaults.styles.marker;

                    if (attrs.hasOwnProperty('ngClick')) {
                        data.ngClick = true;
                    }

                    marker = createFeature(data, viewProjection);
                    if (!isDefined(marker)) {
                        $log.error('[AngularJS - Openlayers] Received invalid data on ' +
                            'the marker.');
                    }
                    // Add a link between the feature and the marker properties
                    marker.set('featureInfo', {
                        type: 'marker',
                        data: data
                    });
                    markerLayer.getSource().addFeature(marker);

                    if (data.message || hasTranscluded) {
                        scope.message = attrs.message;
                        pos = ol.proj.transform([data.lon, data.lat], data.projection,
                            viewProjection);
                        label = createOverlay(element, pos);
                        map.addOverlay(label);
                    }
                    return;
                }
                ////////////////////////////////////////////////////////////////////////////

                scope.$watch('properties', function (properties) {
                    properties.lon = parseFloat(properties.lon);
                    properties.lat = parseFloat(properties.lat);

                    if (!isDefined(marker)) {
                        //生成新的marker
                        data.id = properties.id ? properties.id : data.id;
                        data.projection = properties.projection ? properties.projection :
                            data.projection;
                        data.coord = properties.coord ? properties.coord : data.coord;
                        data.lat = properties.lat ? parseFloat(properties.lat) : data.lat;
                        data.lon = properties.lon ? parseFloat(properties.lon) : data.lon;
                        data.info = properties.info ? properties.info : data.info;

                        //鼠标悬浮事件 标签
                        if (isDefined(properties.overLabel)) {
                            var overLabel = properties.overLabel;
                            if (overLabel.url) { //单独的文件
                                $.get(properties.overLabel.url, function (response) {
                                    data.overLabel = {
                                        title: overLabel.title ? overLabel.title : "",
                                        message: response,
                                        classNm: overLabel.classNm ? overLabel.classNm : "markerOver",
                                        placement: overLabel.placement ? overLabel.placement : "top"
                                    }
                                });
                            } else if (overLabel.message) {
                                data.overLabel = {
                                    title: overLabel.title ? overLabel.title : "",
                                    message: overLabel.message ? overLabel.message : "",
                                    classNm: overLabel.classNm ? overLabel.classNm : "",
                                    placement: overLabel.placement ? overLabel.placement : "top"
                                }
                            }
                        }

                        //鼠标点击事件 标签
                        if (isDefined(properties.clickLabel)) {
                            var clickLabel = properties.clickLabel;
                            data.clickLabel = {
                                id: clickLabel.id ? clickLabel.id : "",
                                title: clickLabel.title ? clickLabel.title : "",
                                message: clickLabel.message ? clickLabel.message : "",
                                url: clickLabel.url ? clickLabel.url : "",
                                classNm: clickLabel.classNm ? clickLabel.classNm : "",
                                placement: clickLabel.placement ? clickLabel.placement : "top"
                            }
                            data.keepOneOverlayVisible = isDefined(clickLabel.keepOneOverlayVisible) ? clickLabel.keepOneOverlayVisible : data.keepOneOverlayVisible;
                        }

                        //直接在元素上定义ng-click方法
                        if (attrs.hasOwnProperty('ngClick')) {
                            data.ngClick = element;
                        }

                        if (isDefined(properties.style)) {
                            data.style = properties.style;
                        } else {
                            data.style = mapDefaults.styles.marker;
                        }

                        marker = createFeature(data, viewProjection);
                        if (!isDefined(marker)) {
                            $log.error('[AngularJS - Openlayers] Received invalid data on ' +
                                'the marker.');
                        }

                        // Add a link between the feature and the marker properties
                        marker.set('featureInfo', {
                            type: 'marker',
                            data: data
                        });

                        markerLayer.getSource().addFeature(marker);
                    } else { //改变已存在的marker的属性
                        var requestedPosition;
                        if (properties.projection === 'pixel') {
                            requestedPosition = properties.coord;
                        } else {
                            requestedPosition = ol.proj.transform([properties.lon, properties.lat], data.projection,
                                map.getView().getProjection());
                        }

                        if (!angular.equals(marker.getGeometry().getCoordinates(), requestedPosition)) {
                            var geometry = new ol.geom.Point(requestedPosition);
                            marker.setGeometry(geometry);
                        }
                        if (isDefined(properties.style)) {
                            var requestedStyle = createStyle(properties.style);
                            if (!angular.equals(marker.getStyle(), requestedStyle)) {
                                marker.setStyle(requestedStyle);
                            }
                        }

                        //显示着的overlay随着marker的移动而移动
                        if (marker.get("overLay") && marker.get("overLay").getMap()) {
                            marker.get("overLay").setPosition(requestedPosition);
                        }

                        //更新存储的属性
                        data.coord = properties.coord ? properties.coord : data.coord;
                        data.lat = properties.lat ? properties.lat : data.lat;
                        data.lon = properties.lon ? properties.lon : data.lon;
                        data.info = properties.info ? properties.info : data.info;

                        if (isDefined(properties.style)) {
                            data.style = properties.style;
                        }
                    }

                    //适应屏幕
                    var extent = markerLayer.getSource().getExtent();
                    map.getView().fit(extent);

                    if (isDefined(label)) {
                        map.removeOverlay(label);
                    }

                    if (!isDefined(properties.label)) {
                        return;
                    }
                    if (isDefined(properties.label)) {
                        var labelShow = properties.label;
                        if (labelShow.url) { //单独的文件
                            $.get(labelShow.url, function (response) {
                                scope.$apply(function () {
                                    scope.message = response;
                                });
                            });
                        } else if (labelShow.message) {
                            scope.message = labelShow.message;
                        }
                    }

                    if (properties.label && properties.label.show === true) {
                        if (data.projection === 'pixel') {
                            pos = data.coord;
                        } else {
                            pos = ol.proj.transform([properties.lon, properties.lat], data.projection,
                                viewProjection);
                        }
                        label = createOverlay(element, pos);
                        map.addOverlay(label);
                    }

                    if (label && properties.label && properties.label.show === false) {
                        map.removeOverlay(label);
                        label = undefined;
                    }

                    //监控点击事件生成的overlay的移除
                    if (properties.clickLabel && properties.clickLabel.remove == true) {
                        angular.forEach(map.getOverlays(), function (value) {
                            if (value.getId() == properties.clickLabel.id) {
                                map.removeOverlay(value);
                                delete scope.properties.clickLabel.remove;
                            }
                        });
                    }
                }, true);
            });
        }
    };
}]);
