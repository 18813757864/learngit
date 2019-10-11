/* author xiarx 20161201
 * cluster  聚集点
 */
angular.module('openlayers-directive').directive('olCluster', ["$log", "$q", "olMapDefaults", "olHelpers", function ($log, $q, olMapDefaults, olHelpers) {

    return {
        restrict: 'E',
        scope: {
            points: '=points',
            style: '=olStyle'
        },
        require: '^openlayers',
        link: function (scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var olScope = controller.getOpenlayersScope();
            var createStyle = olHelpers.createStyle;
            var createFeature = olHelpers.createFeature;

            olScope.getMap().then(function (map) {
                var clusterLayer = olHelpers.createClusterLayer(attrs.zindex || 0, attrs.distance);
                clusterLayer.set('cluster', true);
                map.addLayer(clusterLayer);

                var callbackEvent = attrs.callbackEvent;

                /* 直接new的，会创建很多对象，占用很多内存;复用必然减少很多内存，所以定义变量存储style，
                 * 用到的时候直接赋值，而不是每次都new
                 */
                var atlasManager = new ol.style.AtlasManager({
                    // we increase the initial size so that all symbols fit into
                    // a single atlas image
                    initialSize: 512
                });
                if (scope.style.image.circle) {
                    scope.style.image.circle.atlasManager = {
                        initialSize: 512
                    }
                }
                var style1 = createStyle(scope.style);
                var style2 = "";
                var defaultStyle = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        stroke: new ol.style.Stroke({
                            color: '#fff'
                        }),
                        fill: new ol.style.Fill({
                            color: '#3399CC'
                        }),
                        atlasManager: atlasManager
                    }),
                    text: new ol.style.Text({
                        text: "",
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                });

                var styleFunction = function (feature) {
                    var size = feature.get('features').length;
                    var style;
                    if (size > 1) {
                        /*
                         * 聚集点位的点击悬浮事件是否用默认设置；如果callbackEvent为undefined，则用默认；
                         * 若含有click字段，则点击事件不使用默认；若含有over字段，则悬浮事件不使用默认；
                         */
                        if (callbackEvent) {
                            feature.set('multiFeatureEvent', callbackEvent);
                        }
                        style = style1;
                        if (style && style.getText()) {
                            style.getText().setText(size.toString());
                        }
                    } else {
                        var pointStyle = feature.get('features')[0].get("pointStyle");
                        if (angular.isDefined(pointStyle)) {
                            if (style2) {
                                style = style2;
                            } else {
                                style2 = createStyle(pointStyle);
                                style = style2;
                            }
                        } else {
                            style = style1;
                        }
                    }
                    if (!style) {
                        style = defaultStyle;
                        if (style.getText()) {
                            style.getText().setText(size.toString());
                        }
                    }
                    return style;
                }

                var requestedPosition = "";
                var projection = attrs.projection ? attrs.projection : "EPSG:4326";
                var viewProjection = map.getView().getProjection().getCode();

                scope.$watch("points", function (nVal, oVal) {
                    if (nVal) {
                        var count = nVal.length;
                        var features = new Array();
                        var divHtml = "";

                        var setData = {
                            projection: projection,
                            label: {
                                title: "",
                                message: "",
                                classNm: "",
                                placement: "top"
                            },
                            coord: [0, 0],
                            lat: 0,
                            lon: 0,
                            keepOneOverlayVisible: true,
                            clickLabel: {},
                            overLabel: {}
                        }

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
                                var dataTemp = angular.copy(setData);
                                dataTemp.coord = [parseFloat(nVal[i].lon), parseFloat(nVal[i].lat)];
                                dataTemp.lon = dataTemp.coord[0];
                                dataTemp.lat = dataTemp.coord[1];
                                dataTemp.info = nVal[i].info;

                                if (isDefined(point.clickLabel)) { //点击弹出框
                                    var clickLabel = point.clickLabel;
                                    dataTemp.clickLabel = {
                                        id: clickLabel.id ? clickLabel.id : "",
                                        title: clickLabel.title ? clickLabel.title : "",
                                        message: clickLabel.message ? clickLabel.message : "",
                                        url: clickLabel.url ? clickLabel.url : "",
                                        classNm: clickLabel.classNm ? clickLabel.classNm : "",
                                        placement: clickLabel.placement ? clickLabel.placement : "top"
                                    }
                                    dataTemp.keepOneOverlayVisible = isDefined(clickLabel.keepOneOverlayVisible) ? clickLabel.keepOneOverlayVisible : dataTemp.keepOneOverlayVisible;
                                }

                                if (isDefined(point.ngClick)) { //点击回调
                                    dataTemp.ngClick = element;
                                }

                                if (isDefined(point.overLabel)) { //悬浮弹出框
                                    var overLabel = point.overLabel;
                                    dataTemp.overLabel = {
                                        title: overLabel.title ? overLabel.title : "",
                                        message: overLabel.message ? overLabel.message : "",
                                        url: overLabel.url ? overLabel.url : "",
                                        classNm: overLabel.classNm ? overLabel.classNm : "",
                                        placement: overLabel.placement ? overLabel.placement : "top"
                                    }
                                }

                                feature.set("featureInfo", {
                                    type: "clusterFeature",
                                    data: dataTemp
                                });
                                if (angular.isDefined(nVal[i].pointStyle)) {
                                    feature.set("pointStyle", nVal[i].pointStyle);
                                }

                            }
                        }

                        clusterLayer.getSource().getSource().clear(true);
                        clusterLayer.getSource().getSource().addFeatures(features);

                        clusterLayer.setStyle(styleFunction);


                    }
                }, true);

                scope.$on('$destroy', function () {
                    map.removeLayer(clusterLayer);
                });

            });
        }
    }
            }]);
