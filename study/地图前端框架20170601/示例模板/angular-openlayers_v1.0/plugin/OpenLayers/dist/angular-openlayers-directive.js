(function (root, factory) {
    if (typeof require === 'function' && typeof exports === 'object') {
        // CommonJS
        var ol = require('openlayers');
        exports.angularOpenlayersDirective = factory(ol);
    } else if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['openLayers', 'pOl3', 'angularSanitize', 'colorPicker'], function (ol, P) {
            return root.angularOpenlayersDirective = factory(ol, P);
        });
    } else {
        // Browser globals
        root.angularOpenlayersDirective = factory(root.ol, root.P);
    }
}(this, function (ol, P) {
    angular.module('openlayers-directive', ['ngSanitize']).directive('openlayers', ["$log", "$q", "$compile", "olHelpers", "olMapDefaults", "olData", function ($log, $q, $compile, olHelpers, olMapDefaults, olData) {

        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            scope: {
                center: '=olCenter',
                defaults: '=olDefaults',
                view: '=olView',
                events: '=olEvents'
            },
            template: '<div class="angular-openlayers-map" ng-transclude></div>',
            controller: ["$scope", function ($scope) {
                var _map = $q.defer();
                $scope.getMap = function () {
                    return _map.promise;
                };

                $scope.setMap = function (map) {
                    _map.resolve(map);
                };

                this.getOpenlayersScope = function () {
                    return $scope;
                };
	            }],
            link: function (scope, element, attrs) {
                var isDefined = olHelpers.isDefined;
                var createLayer = olHelpers.createLayer;
                var setMapEvents = olHelpers.setMapEvents;
                var setViewEvents = olHelpers.setViewEvents;
                var setClickMarker = olHelpers.setClickMarker;
                var setOverMarker = olHelpers.setOverMarker;
                var createView = olHelpers.createView;
                var defaults = olMapDefaults.setDefaults(scope);
                var createOverlay = olHelpers.createOverlay;
                var removeOverlay = olHelpers.removeOverlay;

                // Set width and height if they are defined
                if (isDefined(attrs.width)) {
                    if (isNaN(attrs.width)) {
                        element.css('width', attrs.width);
                    } else {
                        element.css('width', attrs.width + 'px');
                    }
                }

                if (isDefined(attrs.height)) {
                    if (isNaN(attrs.height)) {
                        element.css('height', attrs.height);
                    } else {
                        element.css('height', attrs.height + 'px');
                    }
                }

                if (isDefined(attrs.lat)) {
                    defaults.center.lat = parseFloat(attrs.lat);
                }

                if (isDefined(attrs.lon)) {
                    defaults.center.lon = parseFloat(attrs.lon);
                }

                if (isDefined(attrs.zoom)) {
                    defaults.center.zoom = parseFloat(attrs.zoom);
                }

                var controls = ol.control.defaults(defaults.controls);
                var interactions = ol.interaction.defaults(defaults.interactions);
                var view = createView(defaults.view);

                // Create the Openlayers Map Object with the options
                var map = new ol.Map({
                    target: element[0],
                    controls: controls,
                    interactions: interactions,
                    renderer: defaults.renderer,
                    view: view,
                    loadTilesWhileAnimating: defaults.loadTilesWhileAnimating,
                    loadTilesWhileInteracting: defaults.loadTilesWhileInteracting
                });

                scope.$on('$destroy', function () {
                    olData.resetMap(attrs.id);
                });

                // If no layer is defined, set the default tileLayer
                if (!attrs.customLayers) {
                    var l = {
                        type: 'Tile',
                        source: {
                            type: 'OSM'
                        }
                    };
                    var layer = createLayer(l, view.getProjection(), 'default');
                    map.addLayer(layer);
                    map.set('default', true);
                }

                if (!isDefined(attrs.olCenter)) {
                    var c = ol.proj.transform([defaults.center.lon,
	                            defaults.center.lat
	                        ],
                        defaults.center.projection, view.getProjection()
                    );
                    view.setCenter(c);
                    view.setZoom(defaults.center.zoom);
                }


                // Set the Default events for the map
                setMapEvents(defaults.events, map, scope);

                //Set the Default events for the map view
                setViewEvents(defaults.events, map, scope);

                // Resolve the map object to the promises
                scope.setMap(map);
                olData.setMap(map, attrs.id);
            }
        };
	}]);
    angular.module('openlayers-directive').directive('olCenter', ["$log", "$location", "olMapDefaults", "olHelpers", function ($log, $location, olMapDefaults, olHelpers) {
        return {
            restrict: 'A',
            scope: false,
            replace: false,
            require: 'openlayers',

            link: function (scope, element, attrs, controller) {
                var safeApply = olHelpers.safeApply;
                var isValidCenter = olHelpers.isValidCenter;
                var isDefined = olHelpers.isDefined;
                var isArray = olHelpers.isArray;
                var isNumber = olHelpers.isNumber;
                var isSameCenterOnMap = olHelpers.isSameCenterOnMap;
                var setCenter = olHelpers.setCenter;
                var setZoom = olHelpers.setZoom;
                var olScope = controller.getOpenlayersScope();

                olScope.getMap().then(function (map) {
                    var defaults = olMapDefaults.getDefaults(olScope);
                    var view = map.getView();
                    var center = olScope.center;

                    if (attrs.olCenter.search('-') !== -1) {
                        $log.error('[AngularJS - Openlayers] The "center" variable can\'t use ' +
                            'a "-" on his key name: "' + attrs.center + '".');
                        setCenter(view, defaults.view.projection, defaults.center, map);
                        return;
                    }

                    if (!isDefined(center)) {
                        center = {};
                    }

                    if (!isValidCenter(center)) {
                        $log.warn('[AngularJS - Openlayers] invalid \'center\'');
                        center.lat = defaults.center.lat;
                        center.lon = defaults.center.lon;
                        center.zoom = defaults.center.zoom;
                        center.projection = defaults.center.projection;
                    }

                    if (!center.projection) {
                        if (defaults.view.projection !== 'pixel') {
                            center.projection = defaults.center.projection;
                        } else {
                            center.projection = 'pixel';
                        }
                    }

                    if (!isNumber(center.zoom)) {
                        center.zoom = 1;
                    }

                    setCenter(view, defaults.view.projection, center, map);
                    view.setZoom(center.zoom);

                    var centerUrlHash;
                    if (center.centerUrlHash === true) {
                        var extractCenterFromUrl = function () {
                            var search = $location.search();
                            var centerParam;
                            if (isDefined(search.c)) {
                                var cParam = search.c.split(':');
                                if (cParam.length === 3) {
                                    centerParam = {
                                        lat: parseFloat(cParam[0]),
                                        lon: parseFloat(cParam[1]),
                                        zoom: parseInt(cParam[2], 10)
                                    };
                                }
                            }
                            return centerParam;
                        };
                        centerUrlHash = extractCenterFromUrl();

                        olScope.$on('$locationChangeSuccess', function () {
                            var urlCenter = extractCenterFromUrl();
                            if (urlCenter && !isSameCenterOnMap(urlCenter, map)) {
                                safeApply(olScope, function (scope) {
                                    scope.center.lat = urlCenter.lat;
                                    scope.center.lon = urlCenter.lon;
                                    scope.center.zoom = urlCenter.zoom;
                                });
                            }
                        });
                    }

                    var geolocation;
                    olScope.$watchCollection('center', function (center) {

                        if (!center) {
                            return;
                        }

                        if (!center.projection) {
                            center.projection = defaults.center.projection;
                        }

                        if (center.autodiscover) {
                            if (!geolocation) {
                                geolocation = new ol.Geolocation({
                                    projection: ol.proj.get(center.projection)
                                });

                                geolocation.on('change', function () {
                                    if (center.autodiscover) {
                                        var location = geolocation.getPosition();
                                        safeApply(olScope, function (scope) {
                                            scope.center.lat = location[1];
                                            scope.center.lon = location[0];
                                            scope.center.zoom = 12;
                                            scope.center.autodiscover = false;
                                            geolocation.setTracking(false);
                                        });
                                    }
                                });
                            }
                            geolocation.setTracking(true);
                            return;
                        }

                        if (!isValidCenter(center)) {
                            $log.warn('[AngularJS - Openlayers] invalid \'center\'');
                            center = defaults.center;
                        }

                        var viewCenter = view.getCenter();
                        if (viewCenter) {
                            if (defaults.view.projection === 'pixel' || center.projection === 'pixel') {
                                view.setCenter(center.coord);
                            } else {
                                var actualCenter =
                                    ol.proj.transform(viewCenter, defaults.view.projection, center.projection);
                                if (!(actualCenter[1] === center.lat && actualCenter[0] === center.lon)) {
                                    setCenter(view, defaults.view.projection, center, map);
                                }
                            }
                        }

                        if (view.getZoom() !== center.zoom) {
                            setZoom(view, center.zoom, map);
                        }
                    });

                    var moveEndEventKey = map.on('moveend', function () {
                        safeApply(olScope, function (scope) {

                            if (!isDefined(scope.center)) {
                                return;
                            }

                            var center = map.getView().getCenter();
                            scope.center.zoom = view.getZoom();

                            if (defaults.view.projection === 'pixel' || scope.center.projection === 'pixel') {
                                scope.center.coord = center;
                                return;
                            }

                            if (scope.center) {
                                var proj = ol.proj.transform(center, defaults.view.projection, scope.center.projection);
                                scope.center.lat = proj[1];
                                scope.center.lon = proj[0];

                                // Notify the controller about a change in the center position
                                olHelpers.notifyCenterUrlHashChanged(olScope, scope.center, $location.search());

                                // Calculate the bounds if needed
                                if (isArray(scope.center.bounds)) {
                                    var extent = view.calculateExtent(map.getSize());
                                    var centerProjection = scope.center.projection;
                                    var viewProjection = defaults.view.projection;
                                    scope.center.bounds = ol.proj.transformExtent(extent, viewProjection, centerProjection);
                                }
                            }
                        });
                    });

                    olScope.$on('$destroy', function () {
                        ol.Observable.unByKey(moveEndEventKey);
                    });
                });
            }
        };
	}]);
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
                    if (scope.style && scope.style.image && scope.style.image.circle) {
                        scope.style.image.circle.atlasManager = {
                            initialSize: 512
                        };
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
                            if (style && style.getText()) {
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
                        radius: parseInt(attrs.radius, 10) || 5
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
    /* author xiarx 20161019
     * interaction
     */
    angular.module('openlayers-directive').directive('olInteraction', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function ($log, $q, olData, olMapDefaults, olHelpers) {
        var drawLayerManager = (function () {
            var mapDict = [];
            var modifyFeatures = new ol.Collection();

            function getMapIndex(map) {
                return mapDict.map(function (record) {
                    return record.map;
                }).indexOf(map);
            }

            return {
                getInst: function getDrawLayerInst(scope, map) {
                    var mapIndex = getMapIndex(map);

                    if (mapIndex === -1) {
                        var drawLayer = olHelpers.createVectorLayer();
                        drawLayer.set('draws', true);
                        map.addLayer(drawLayer);
                        mapDict.push({
                            map: map,
                            drawLayer: drawLayer,
                            instScopes: []
                        });
                        mapIndex = mapDict.length - 1;
                    }

                    mapDict[mapIndex].instScopes.push(scope);

                    return mapDict[mapIndex].drawLayer;
                },
                getModifyColletion: function getModifyColletion() {
                    return modifyFeatures;
                },
                setModifyColletion: function setModifyColletion(arr) {
                    modifyFeatures = arr;
                },
                deregisterScope: function deregisterScope(scope, map) {
                    var mapIndex = getMapIndex(map);
                    if (mapIndex === -1) {
                        throw Error('This map has no features');
                    }

                    var scopes = mapDict[mapIndex].instScopes;
                    var scopeIndex = scopes.indexOf(scope);
                    if (scopeIndex === -1) {
                        throw Error('Scope wan\'t registered');
                    }

                    scopes.splice(scopeIndex, 1);

                    if (!scopes.length) {
                        // map.removeLayer(mapDict[mapIndex].drawLayer);
                        delete mapDict[mapIndex].drawLayer;
                        delete mapDict[mapIndex];
                    }
                }
            }
        })();
        return {
            restrict: 'E',
            scope: {
                properties: '=olInteractionProperties'
            },
            replace: false,
            require: '^openlayers',
            link: function (scope, element, attrs, controller) {
                var isDefined = olHelpers.isDefined;
                var olScope = controller.getOpenlayersScope();
                var createFeature = olHelpers.createFeature;
                var createOverlay = olHelpers.createOverlay;
                var createVectorLayer = olHelpers.createVectorLayer;
                var createStyle = olHelpers.createStyle;
                var mapDefaults = olMapDefaults.getDefaults(olScope);

                var olInteraction = "",
                    modifyInteraction = "",
                    select = "";
                var olInteractionOps;

                olScope.getMap().then(function (map) {
                    var getInteractionClasses = olHelpers.getInteractionClasses;
                    var interactionClasses = getInteractionClasses();

                    scope.$on('$destroy', function () {
                        if (olInteraction) {
                            map.removeInteraction(olInteraction);
                        }

                        if (modifyInteraction) {
                            map.removeInteraction(modifyInteraction);
                        }

                        map.removeInteraction(select);
                        map.un("click", scope.delItem);

                        //drawLayerManager.deregisterScope(scope, map);
                    });

                    if (!isDefined(scope.properties) || !isDefined(scope.properties.interaction)) {
                        if (attrs.name) {
                            if (isDefined(scope.properties)) {
                                olInteractionOps = angular.copy(scope.properties);

                                switch (attrs.name) {
                                    case "dragZoom": //放大缩小
                                        switch (olInteractionOps.condition) {
                                            case "mouseOnly": //鼠标画矩形缩放
                                                olInteractionOps.condition = ol.events.condition.mouseOnly;
                                                break;
                                            case "shiftKeyOnly": //按住shift键，鼠标画矩形缩放
                                                olInteractionOps.condition = ol.events.condition.shiftKeyOnly;
                                                break;
                                            default:
                                                ;
                                        }
                                        olInteraction = new interactionClasses[attrs.name](olInteractionOps);
                                        map.addInteraction(olInteraction);
                                        break;
                                    case "draw": //绘制
                                        var drawLayer = drawLayerManager.getInst(scope, map);

                                        if (isDefined(olInteractionOps.style)) {
                                            var style = createStyle(olInteractionOps.style);
                                            olInteractionOps.style = style;
                                        }

                                        olInteraction = new interactionClasses[attrs.name](olInteractionOps);
                                        map.addInteraction(olInteraction);

                                        olInteraction.on('drawstart', function (evt) { //监听绘制开始动作，改变feature的样式
                                            var feature = evt.feature;

                                            if (olInteractionOps.changeStyle instanceof Function) {
                                                olInteractionOps.changeStyle();
                                                olInteractionOps = angular.copy(scope.properties);
                                                if (isDefined(olInteractionOps.style)) {
                                                    var style = createStyle(olInteractionOps.style);
                                                    feature.setStyle(style);
                                                    drawLayer.getSource().addFeature(feature);
                                                }
                                            } else {
                                                if (!olInteractionOps.style) {
                                                    var style = createStyle(mapDefaults.styles.feature);
                                                    feature.setStyle(style);
                                                    drawLayer.getSource().addFeature(feature);
                                                } else {
                                                    var style = createStyle(olInteractionOps.style);
                                                    feature.setStyle(style);
                                                    drawLayer.getSource().addFeature(feature);
                                                }
                                            }
                                        });

                                        olInteraction.on('drawend', function (evt) {
                                            if (olInteractionOps.modify) { //可以编辑
                                                var modifyFeatures = drawLayerManager.getModifyColletion();
                                                if (modifyInteraction == "") {
                                                    modifyInteraction = new interactionClasses["modify"]({
                                                        features: modifyFeatures
                                                    });
                                                    map.addInteraction(modifyInteraction);
                                                }

                                                var feature = evt.feature;
                                                modifyFeatures.push(feature);
                                                drawLayerManager.setModifyColletion(modifyFeatures);
                                            }
                                            if (olInteractionOps.drawFinished instanceof Function) {
                                                olInteractionOps.drawFinished(evt.feature);
                                            }
                                        });

                                        break;
                                    case "del":
                                        var delItems = [];
                                        scope.delItem = function (evt) {
                                            //var feature = select.getFeatures().item(0);
                                            var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                                                return feature;
                                            });
                                            if (feature && feature.getGeometry().getType()) {
                                                delItems.push(feature);
                                                if (feature.getStyle() && feature.getStyle().getFill()) {
                                                    feature.getStyle().getFill().setColor("rgba(255,0,0,1)");
                                                }
                                                if (feature.getStyle() && feature.getStyle().getStroke()) {
                                                    feature.getStyle().getStroke().setColor("rgba(255,0,0,1)");
                                                }
                                                if (feature.getStyle() && feature.getStyle().getImage()) {
                                                    feature.getStyle().getImage().getFill().setColor("rgba(255,0,0,1)");
                                                    feature.getStyle().getImage().getStroke().setColor("rgba(255,0,0,1)");
                                                }
                                            }
                                            evt.preventDefault();
                                        }

                                        select = new interactionClasses["select"]({
                                            wrapX: false
                                        });
                                        map.addInteraction(select);
                                        map.on("click", scope.delItem);

                                        scope.$watch("properties.del", function (nVal, oVal) {
                                            if (nVal) {
                                                delItems.forEach(function (item) {
                                                    drawLayerManager.getInst(scope, map).getSource().removeFeature(item);
                                                })

                                                //map.renderSync();
                                                delItems = [];
                                                scope.properties.del = false;
                                            }
                                        })
                                        break;
                                    default:
                                        ;
                                }
                            }
                        }
                        return;
                    }
                });
            }
        };
	}]);
    angular.module('openlayers-directive').directive('olLayer', ["$log", "$q", "olMapDefaults", "olHelpers", function ($log, $q, olMapDefaults, olHelpers) {

        return {
            restrict: 'E',
            scope: {
                properties: '=olLayerProperties',
                onLayerCreated: '&'
            },
            replace: false,
            require: '^openlayers',
            link: function (scope, element, attrs, controller) {
                var isDefined = olHelpers.isDefined;
                var equals = olHelpers.equals;
                var olScope = controller.getOpenlayersScope();
                var createLayer = olHelpers.createLayer;
                var setVectorLayerEvents = olHelpers.setVectorLayerEvents;
                var detectLayerType = olHelpers.detectLayerType;
                var createStyle = olHelpers.createStyle;
                var isBoolean = olHelpers.isBoolean;
                var addLayerBeforeMarkers = olHelpers.addLayerBeforeMarkers;
                var isNumber = olHelpers.isNumber;
                var insertLayer = olHelpers.insertLayer;
                var removeLayer = olHelpers.removeLayer;
                var addLayerToGroup = olHelpers.addLayerToGroup;
                var removeLayerFromGroup = olHelpers.removeLayerFromGroup;
                var getGroup = olHelpers.getGroup;

                olScope.getMap().then(function (map) {
                    var projection = map.getView().getProjection();
                    var defaults = olMapDefaults.setDefaults(olScope);
                    var layerCollection = map.getLayers();
                    var olLayer;

                    scope.$on('$destroy', function () {
                        if (scope.properties.group) {
                            removeLayerFromGroup(layerCollection, olLayer, scope.properties.group);
                        } else {
                            removeLayer(layerCollection, olLayer.index);
                        }

                        map.removeLayer(olLayer);
                    });

                    if (!isDefined(scope.properties)) {
                        if (isDefined(attrs.sourceType) && isDefined(attrs.sourceUrl)) {
                            var l = {
                                source: {
                                    url: attrs.sourceUrl,
                                    type: attrs.sourceType
                                }
                            };

                            olLayer = createLayer(l, projection, attrs.layerName, scope.onLayerCreated);
                            if (detectLayerType(l) === 'Vector') {
                                setVectorLayerEvents(defaults.events, map, scope, attrs.name);
                            }
                            addLayerBeforeMarkers(layerCollection, olLayer);
                        }
                        return;
                    }

                    scope.$watch('properties', function (properties, oldProperties) {
                        if (!isDefined(properties.source) || !isDefined(properties.source.type)) {
                            return;
                        }

                        if (!isDefined(properties.visible)) {
                            properties.visible = true;
                            return;
                        }

                        if (!isDefined(properties.opacity)) {
                            properties.opacity = 1;
                            return;
                        }

                        var style;
                        var group;
                        var collection;
                        if (!isDefined(olLayer)) {
                            olLayer = createLayer(properties, projection, scope.onLayerCreated);
                            if (isDefined(properties.group)) {
                                addLayerToGroup(layerCollection, olLayer, properties.group);
                            } else if (isDefined(properties.index)) {
                                insertLayer(layerCollection, properties.index, olLayer);
                            } else {
                                addLayerBeforeMarkers(layerCollection, olLayer);
                            }

                            if (detectLayerType(properties) === 'Vector') {
                                setVectorLayerEvents(defaults.events, map, scope, properties.name);
                            }

                            if (isBoolean(properties.visible)) {
                                olLayer.setVisible(properties.visible);
                            }

                            if (properties.opacity) {
                                olLayer.setOpacity(properties.opacity);
                            }

                            if (angular.isArray(properties.extent)) {
                                olLayer.setExtent(properties.extent);
                            }

                            if (properties.style) {
                                if (!angular.isFunction(properties.style)) {
                                    style = createStyle(properties.style);
                                } else {
                                    style = properties.style;
                                }
                                // not every layer has a setStyle method
                                if (olLayer.setStyle && angular.isFunction(olLayer.setStyle)) {
                                    olLayer.setStyle(style);
                                }
                            }

                            if (properties.minResolution) {
                                olLayer.setMinResolution(properties.minResolution);
                            }

                            if (properties.maxResolution) {
                                olLayer.setMaxResolution(properties.maxResolution);
                            }

                        } else {
                            var isNewLayer = (function (olLayer) {
                                // this function can be used to verify whether a new layer instance has
                                // been created. This is needed in order to re-assign styles, opacity
                                // etc...
                                return function (layer) {
                                    return layer !== olLayer;
                                };
                            })(olLayer);

                            // set source properties
                            if (isDefined(oldProperties) && !equals(properties.source, oldProperties.source)) {
                                var idx = olLayer.index;
                                collection = layerCollection;
                                group = olLayer.get('group');

                                if (group) {
                                    collection = getGroup(layerCollection, group).getLayers();
                                }

                                collection.removeAt(idx);

                                olLayer = createLayer(properties, projection, scope.onLayerCreated);
                                olLayer.set('group', group);

                                if (isDefined(olLayer)) {
                                    insertLayer(collection, idx, olLayer);

                                    if (detectLayerType(properties) === 'Vector') {
                                        setVectorLayerEvents(defaults.events, map, scope, properties.name);
                                    }
                                }
                            }

                            // set opacity
                            if (isDefined(oldProperties) &&
                                properties.opacity !== oldProperties.opacity || isNewLayer(olLayer)) {
                                if (isNumber(properties.opacity) || isNumber(parseFloat(properties.opacity))) {
                                    olLayer.setOpacity(properties.opacity);
                                }
                            }

                            // set index
                            if (isDefined(properties.index) && properties.index !== olLayer.index) {
                                collection = layerCollection;
                                group = olLayer.get('group');

                                if (group) {
                                    collection = getGroup(layerCollection, group).getLayers();
                                }

                                removeLayer(collection, olLayer.index);
                                insertLayer(collection, properties.index, olLayer);
                            }

                            // set group
                            if (isDefined(properties.group) && properties.group !== oldProperties.group) {
                                removeLayerFromGroup(layerCollection, olLayer, oldProperties.group);
                                addLayerToGroup(layerCollection, olLayer, properties.group);
                            }

                            // set visibility
                            if (isDefined(oldProperties) &&
                                isBoolean(properties.visible) &&
                                properties.visible !== oldProperties.visible || isNewLayer(olLayer)) {
                                olLayer.setVisible(properties.visible);
                            }

                            // set style
                            if (isDefined(properties.style) &&
                                !equals(properties.style, oldProperties.style) || isNewLayer(olLayer)) {
                                if (!angular.isFunction(properties.style)) {
                                    style = createStyle(properties.style);
                                } else {
                                    style = properties.style;
                                }
                                // not every layer has a setStyle method
                                if (olLayer.setStyle && angular.isFunction(olLayer.setStyle)) {
                                    olLayer.setStyle(style);
                                }
                            }

                            //set min resolution
                            if (!equals(properties.minResolution, oldProperties.minResolution) || isNewLayer(olLayer)) {
                                if (isDefined(properties.minResolution)) {
                                    olLayer.setMinResolution(properties.minResolution);
                                }
                            }

                            //set max resolution
                            if (!equals(properties.maxResolution, oldProperties.maxResolution) || isNewLayer(olLayer)) {
                                if (isDefined(properties.maxResolution)) {
                                    olLayer.setMaxResolution(properties.maxResolution);
                                }
                            }
                        }
                    }, true);
                });
            }
        };
	}]);
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
                            data.lat = properties.lat ? properties.lat : data.lat;
                            data.lon = properties.lon ? properties.lon : data.lon;
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

                            //适应屏幕
                            /*var extent = markerLayer.getSource().getExtent();
		                    map.getView().fit(extent, {
	                            size: map.getSize(),
	                            padding: [15, 15, 15, 15],
	                            duration: 150
	                        });*/
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
    /*
     * 测距
     * 改编至openlayers官网实例
     * type: "LineString", "Polygon"
     */
    angular.module('openlayers-directive').directive('olMeasure', ["$log", "$q", "olMapDefaults", "$interval", "olHelpers", "$compile", function ($log, $q, olMapDefaults, $interval, olHelpers, $compile) {
        return {
            restrict: 'E',
            require: '^openlayers',
            scope: {
                type: '=type'
            },
            link: function (scope, element, attrs, controller) {
                var isDefined = olHelpers.isDefined;
                var olScope = controller.getOpenlayersScope();
                var createOverlay = olHelpers.createOverlay;
                var createFeature = olHelpers.createFeature;

                /**
                 * 当前绘制的要素（Currently drawn feature.）
                 * @type {ol.Feature}
                 */
                var sketch;
                /**
                 * 帮助提示框对象（The help tooltip element.）
                 * @type {Element}
                 */
                var helpTooltipElement;
                /**
                 *帮助提示框显示的信息（Overlay to show the help messages.）
                 * @type {ol.Overlay}
                 */
                var helpTooltip;
                /**
                 * 测量工具提示框对象（The measure tooltip element. ）
                 * @type {Element}
                 */
                var measureTooltipElement;
                /**
                 *测量工具中显示的测量值（Overlay to show the measurement.）
                 * @type {ol.Overlay}
                 */
                var measureTooltip;
                /**
                 * 距离提示框对象（The measure tooltip element. ）
                 * @type {Element}
                 */
                var distanceTooltipElement;
                /**
                 *距离提示框显示的测量值（Overlay to show the measurement.）
                 * @type {ol.Overlay}
                 */
                var distanceTooltip;

                var typeSelect = scope.type; //测量类型对象,'Polygon' 或者 'LineString'
                var draw, isDraw = true,
                    featureNum = 0; // global so we can remove it later. featureNum作为feature的id
                var listenerMove, listenerClick;
                var styles = []; //样式

                olScope.getMap().then(function (map) {
                    var viewProjection = map.getView().getProjection().getCode();
                    $("canvas").css("cursor", "url(./images/measure.png),auto");

                    scope.$on('$destroy', function () {
                        $("canvas").css("cursor", "default");
                        map.removeLayer(vector);
                        map.removeInteraction(draw);

                        //移除overlay
                        var layArr = map.getOverlays();
                        var len = layArr.getLength();
                        for (var i = len - 1; i >= 0; i--) {
                            if (layArr.item(i).get("name") && layArr.item(i).get("name").indexOf("measure") != -1) {
                                layArr.removeAt(i);
                            }
                        }

                        ol.Observable.unByKey(listenerMove);
                        $(map.getViewport()).off('mouseout');
                    });

                    /**
                     *创建一个新的帮助提示框（tooltip）
                     */
                    function createHelpTooltip(name) {
                        if (helpTooltipElement) {
                            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
                        }

                        helpTooltipElement = document.createElement('div');
                        helpTooltipElement.className = 'tooltip hidden';
                        helpTooltip = createOverlay($(helpTooltipElement));
                        helpTooltip.set("name", name);
                        helpTooltip.setOffset([15, 30]);

                        map.addOverlay(helpTooltip);
                    }
                    /**
                     *创建一个新的测量工具提示框（tooltip）
                     */
                    function createMeasureTooltip(name) {
                        if (measureTooltipElement) {
                            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
                        }

                        measureTooltipElement = document.createElement('div');
                        measureTooltipElement.className = 'tooltip tooltip-measure';
                        measureTooltip = createOverlay($(measureTooltipElement));
                        measureTooltip.set("name", name);
                        measureTooltip.setOffset([15, 30]);

                        map.addOverlay(measureTooltip);
                    }
                    /**
                     *创建一个新的节点距起点距离的提示框（tooltip）
                     */
                    function createDistanceTooltip(name) {
                        if (distanceTooltipElement) {
                            distanceTooltipElement.parentNode.removeChild(distanceTooltipElement);
                        }

                        distanceTooltipElement = document.createElement('div');
                        distanceTooltipElement.className = 'tooltip tooltip-distance';
                        distanceTooltip = createOverlay($(distanceTooltipElement));
                        distanceTooltip.set("name", name);
                        distanceTooltip.setOffset([10, 0]);

                        map.addOverlay(distanceTooltip);
                    }

                    /**
                     * 测量长度输出
                     * @param {ol.geom.LineString} line
                     * @return {string}
                     */
                    var formatLength = function (line) {
                        var length = Math.round(line.getLength() * 100) / 100; //直接得到线的长度
                        var output;
                        if (length > 100) {
                            output = '<span>' + (Math.round(length / 1000 * 100) / 100) + '</span> ' + 'km'; //换算成KM单位
                        } else {
                            output = '<span>' + (Math.round(length * 100) / 100) + '</span> ' + 'm'; //m为单位
                        }
                        return output; //返回线的长度
                    };
                    /**
                     * 测量面积输出
                     * @param {ol.geom.Polygon} polygon
                     * @return {string}
                     */
                    var formatArea = function (polygon) {
                        var area = polygon.getArea(); //直接获取多边形的面积
                        var output;
                        if (area > 10000) {
                            output = '<span>' + (Math.round(area / 1000000 * 100) / 100) + '</span> ' + 'km<sup>2</sup>'; //换算成KM单位
                        } else {
                            output = '<span>' + (Math.round(area * 100) / 100) + '</span> ' + 'm<sup>2</sup>'; //m为单位
                        }
                        return output; //返回多边形的面积
                    };

                    /**
                     * 鼠标移动事件处理函数
                     * @param {ol.MapBrowserEvent} evt
                     */
                    var pointerMoveHandler = function (evt) {
                        if (evt.dragging) {
                            return;
                        }

                        //判断是否在绘制设置相应的帮助提示信息
                        if (sketch) {
                            $(helpTooltipElement).addClass('hidden');
                        } else {
                            helpTooltipElement.innerHTML = '单击确定起点'; //将提示信息设置到对话框中显示
                            helpTooltip.setPosition(evt.coordinate); //设置帮助提示框的位置
                            $(helpTooltipElement).removeClass('hidden'); //移除帮助提示框的隐藏样式进行显示
                        }
                    };
                    listenerMove = map.on('pointermove', pointerMoveHandler); //地图容器绑定鼠标移动事件，动态显示帮助提示框内容
                    //地图绑定鼠标移出事件，鼠标移出时为帮助提示框设置隐藏样式
                    $(map.getViewport()).on('mouseout', function () {
                        $(helpTooltipElement).addClass('hidden');
                    });

                    /*
                     * 添加节点样式
                     */
                    function createPointStyle(coord, id) {
                        var data = {
                            coords: coord,
                            style: {
                                image: new ol.style.Circle({
                                    radius: 4,
                                    fill: new ol.style.Fill({
                                        color: 'white' //填充颜色
                                    }),
                                    stroke: new ol.style.Stroke({
                                        color: '#005699',
                                        width: 2
                                    })
                                })
                            }
                        };
                        var feature = createFeature(data, viewProjection);
                        feature.set("id", id);
                        source.addFeature(feature);
                    }

                    var source = new ol.source.Vector(); //图层数据源
                    var drawStyle = new ol.style.Style({ //绘制过程中的样式
                        fill: new ol.style.Fill({
                            color: 'rgba(142, 77, 209, 0.3)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(142, 77, 209, 0.7)',
                            lineDash: [10, 5],
                            width: 2
                        }),
                        image: new ol.style.Circle({
                            radius: 2,
                            fill: new ol.style.Fill({
                                color: 'white' //填充颜色
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#005699',
                                width: 2
                            })
                        })
                    });
                    var finishedStyle = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(142, 77, 209, 0.3)' //填充颜色
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#8e4dd1', //边框颜色
                            width: 2 // 边框宽度
                        })
                    });

                    var vector = new ol.layer.Vector({
                        source: source,
                        style: finishedStyle
                    });
                    map.addLayer(vector);
                    /**
                     * 加载交互绘制控件函数 
                     */
                    function addInteraction() {
                        styles = [];
                        styles.push(drawStyle);
                        draw = new ol.interaction.Draw({
                            source: source, //测量绘制层数据源
                            type: /** @type {ol.geom.GeometryType} */ (typeSelect), //几何图形类型
                            style: styles
                        });
                        map.addInteraction(draw);

                        createMeasureTooltip("measure1"); //创建测量工具提示框
                        createHelpTooltip("measure"); //创建帮助提示框

                        var listenerChange;
                        //绑定交互绘制工具开始绘制的事件
                        draw.on('drawstart', function (evt) {
                            isDraw = true;
                            featureNum++;
                            // set sketch
                            sketch = evt.feature; //绘制的要素

                            //给该feature以及其overlay一个唯一标识，以便于删除
                            var id = "measure" + featureNum;
                            sketch.set("id", id);

                            /** @type {ol.Coordinate|undefined} */
                            var tooltipCoord = evt.coordinate; // 绘制的坐标


                            listenerClick = map.on("click", function (evt) {
                                var coord = sketch.getGeometry().getLastCoordinate();
                                if (typeSelect == "LineString") {
                                    distanceTooltipElement = null; //置空测量工具提示框对象
                                    createDistanceTooltip(id);
                                    distanceTooltipElement.innerHTML = "起点";
                                    distanceTooltip.setPosition(coord);
                                }

                                createPointStyle(coord, id);
                            });

                            //绑定change事件，根据绘制几何类型得到测量长度值或面积值，并将其设置到测量工具提示框中显示
                            listenerChange = sketch.getGeometry().on('change', function (evt) {
                                var geom = evt.target; //绘制几何要素
                                var output = "",
                                    resultValue = "";
                                if (geom instanceof ol.geom.Polygon) {
                                    resultValue = formatArea( /** @type {ol.geom.Polygon} */ (geom));
                                    output += "<div>面积：" + resultValue + "</div><div>单击继续绘制，双击结束</div>"; //面积值
                                    tooltipCoord = geom.getLastCoordinate(); //坐标
                                } else if (geom instanceof ol.geom.LineString) {
                                    resultValue = formatLength( /** @type {ol.geom.LineString} */ (geom));
                                    output = "<div>总长：" + resultValue + "</div><div>单击继续绘制，双击结束</div>"; //长度值
                                    tooltipCoord = geom.getLastCoordinate(); //坐标

                                }
                                measureTooltipElement.innerHTML = output; //将测量值设置到测量工具提示框中显示
                                measureTooltip.setPosition(tooltipCoord); //设置测量工具提示框的显示位置

                                //添加多线段的中间点的距离信息
                                if (listenerClick) {
                                    ol.Observable.unByKey(listenerClick);
                                }
                                listenerClick = map.on("click", function (evt) {
                                    if (typeSelect == "LineString") {
                                        distanceTooltipElement = null; //置空测量工具提示框对象
                                        createDistanceTooltip(id);
                                        distanceTooltipElement.innerHTML = resultValue;
                                        distanceTooltip.setPosition(tooltipCoord);
                                    }

                                    createPointStyle(tooltipCoord, id);
                                });
                            });
                        }, this);
                        //绑定交互绘制工具结束绘制的事件
                        draw.on('drawend', function (evt) {
                            isDraw = false; //绘制结束，要素样式改变

                            //绘制结束，测量提示框的内容变成最后结果
                            var geom = sketch.getGeometry();
                            var output = "",
                                coords, len;
                            if (geom instanceof ol.geom.Polygon) {
                                output += "<div>面积：" + formatArea( /** @type {ol.geom.Polygon} */ (geom)) + "</div>"; //面积值
                                var tooltipCoord = geom.getInteriorPoint().getCoordinates();
                                coords = geom.getCoordinates()[0]; //坐标
                                len = coords.length;
                                measureTooltip.setPosition(tooltipCoord);
                                measureTooltip.setOffset([0, -7]);
                            } else if (geom instanceof ol.geom.LineString) {
                                coords = geom.getCoordinates(); //坐标
                                len = coords.length;
                                output = "<div>总长：" + formatLength( /** @type {ol.geom.LineString} */ (geom)) + "</div>"; //长度值

                                //根据最后一个点和倒数第二点之间的上下位置，来决定测量值显示位置
                                if (coords[len - 1][1] > coords[len - 2][1]) {
                                    measureTooltip.setOffset([-5, -25]);
                                } else {
                                    measureTooltip.setOffset([-5, 25]);
                                }
                            }
                            measureTooltipElement.innerHTML = output; //将测量值设置到测量工具提示框中显示
                            measureTooltipElement.className = 'tooltip tooltip-static'; //设置测量提示框的样式

                            //删除LineString最后一个距离提示框，产生删除按钮
                            if (distanceTooltipElement && distanceTooltipElement.childNodes.length != 2) { //绘制过程中没有产生节点的情况
                                distanceTooltipElement = null; //置空测量工具提示框对象
                            }
                            createDistanceTooltip(sketch.get("id"));
                            var closeHtml = "<i class='fa fa-close' style='cursor:pointer;' ng-click='delObj(\"" + sketch.get("id") + "\")'></i>";
                            var ele = $compile(closeHtml)(scope);
                            angular.element(distanceTooltipElement).html(ele);

                            distanceTooltipElement.className = 'tooltip tooltip-close'; //设置删除按钮的样式
                            distanceTooltip.setPosition(geom.getLastCoordinate());

                            //根据最后一个点和倒数第二点之间的左右位置，来决定删除按钮显示位置
                            if (coords[len - 1][0] > coords[len - 2][0]) {
                                distanceTooltip.setOffset([10, 0]);
                            } else {
                                distanceTooltip.setOffset([-25, 0]);
                            }

                            // unset sketch
                            sketch = null; //置空当前绘制的要素对象
                            // unset tooltip so that a new one can be created
                            measureTooltipElement = null; //置空测量工具提示框对象
                            createMeasureTooltip("measure" + (featureNum + 1)); //重新创建一个测试工具提示框显示结果
                            ol.Observable.unByKey(listenerChange);
                            ol.Observable.unByKey(listenerClick);
                        }, this);
                    }

                    scope.$watch("type", function (nval, oval) {
                        map.removeInteraction(draw);
                        typeSelect = scope.type;
                        addInteraction();
                    })


                    //删除feature及相关overlay
                    scope.delObj = function (id) {
                        var featureArr = source.getFeatures();
                        var total = featureArr.length;
                        for (var i = total - 1; i >= 0; i--) {
                            if (featureArr[i].get("id") == id) {
                                source.removeFeature(featureArr[i]);
                            }
                        }

                        var layArr = map.getOverlays();
                        var len = layArr.getLength();
                        for (var i = len - 1; i >= 0; i--) {
                            if (layArr.item(i).get("name") == id) {
                                layArr.removeAt(i);
                            }
                        }
                    }
                });

            }

        }
	}]);
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

                var label = null;
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
                                } else {
                                    label = setOverlay(null, map, data, scope.$parent);
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
                        if (!angular.equals(nVal, oVal) || !label) {
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
    angular.module('openlayers-directive').directive('olPath', ["$log", "$q", "olMapDefaults", "olHelpers", function ($log, $q, olMapDefaults, olHelpers) {

        return {
            restrict: 'E',
            scope: {
                properties: '=olGeomProperties',
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

                        /*xiarx 20161120 添加线的绘制  type种类Point, LineString, MultiLineString, Polygon*/
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
                    feature, perDegree;
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
                            perDegree = getGeodesicDistance(viewProjection, mapCoord, [mapCoord[0] + 1, mapCoord[1]]);
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
                                scope.refreshData();
                                scope.$apply();
                            }
                        });
                    }
                });
            }
        }
	}]);
    /*
     * 标绘
     * 依赖第三方库p-ol3
     * MARKER, ARC, CURVE, POLYLINE, FREEHAND_LINE, CIRCLE, ELLIPSE, LUNE, SECTOR, CLOSED_CURVE, POLYGON, RECTANGLE, FREEHAND_POLYGON, GATHERING_PLACE, DOUBLE_ARROW, STRAIGHT_ARROW
     * FINE_ARROW, ASSAULT_DIRECTION, ATTACK_ARROW, TAILED_ATTACK_ARROW, SQUAD_COMBAT, TAILED_SQUAD_COMBAT
     * MARKER-text, MARKER-textVertical, MARKER-icon
     */
    angular.module('openlayers-directive').directive('olPlot', ["$log", "$q", "olMapDefaults", "$interval", "olHelpers", "$compile", function ($log, $q, olMapDefaults, $interval, olHelpers, $compile) {
        return {
            restrict: 'E',
            require: '^openlayers',
            scope: {
                type: "=",
                isEdit: "=",
                drawEnd: "&"
            },
            controller: 'SucPlotController',
            controllerAs: 'plotOl',
            replace: true,
            template: '<div class="hidden"><div ng-repeat="item in textLays"><plot-text properties="item"></plot-text></div></div>',
            link: function (scope, element, attrs, controller) {
                var plotDraw, plotEdit, drawOverlay, drawStyle, listenerClick;
                var createVectorLayer = olHelpers.createVectorLayer;
                var olScope = controller.getOpenlayersScope();
                var setClickMarker = olHelpers.setClickMarker;
                var createOverlay = olHelpers.createOverlay;
                var createStyle = olHelpers.createStyle;

                /**
                 * 文字备注弹框数组
                 * @type {Array}
                 */
                scope.textLays = [];
                /**
                 * 样式编辑弹框对象/文字标注弹框对象（Overlay to show the edit page.）
                 * @type {ol.Overlay}
                 */
                var label;

                /**
                 * 是否处于激活绘制但还未绘制的阶段
                 * @type {Boolean}
                 */
                var sketch;
                /**
                 * 帮助提示框对象（The help tooltip element.）
                 * @type {Element}
                 */
                var helpTooltipElement;
                /**
                 * 帮助提示框内容
                 * @type {String}
                 */
                var helpTooltipHtml = "";
                /**
                 *帮助提示框显示的信息（Overlay to show the help messages.）
                 * @type {ol.Overlay}
                 */
                var helpTooltip;

                olScope.getMap().then(function (map) {
                    var mapDefaults = olMapDefaults.getDefaults(olScope);
                    var markerDefaults = createStyle(mapDefaults.styles.marker);
                    scope.$on('$destroy', function () {
                        plotEdit.deactivate();
                        ol.Observable.unByKey(listenerClick);
                        drawOverlay.setMap(null);
                        map.removeOverlay(label);

                        ol.Observable.unByKey(listenerMove);
                        $(map.getViewport()).off('mouseout');
                        $(map.getViewport()).off('contextmenu');
                        map.removeOverlay(helpTooltip);
                        scope.textLays = [];
                    });

                    /**
                     *创建一个新的帮助提示框（tooltip）
                     */
                    function createHelpTooltip(name) {
                        if (helpTooltipElement) {
                            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
                        }

                        helpTooltipElement = document.createElement('div');
                        helpTooltipElement.className = 'tooltip hidden';
                        helpTooltip = createOverlay($(helpTooltipElement));
                        helpTooltip.set("name", name);
                        helpTooltip.setOffset([15, 30]);

                        map.addOverlay(helpTooltip);
                    }

                    /**
                     *创建一个新的样式编辑菜单（tooltip）
                     */
                    function createEditLay(feature) {
                        var plotType = feature.get("plotType");

                        //弹框中数据刷新
                        var style = feature.getStyle();
                        scope.plotOl.type = plotType; //line,area
                        scope.plotOl.selectedStrokeColor = {
                            color: style.getStroke().getColor(),
                            width: style.getStroke().getWidth()
                        }
                        if (plotType == "area") {
                            scope.plotOl.selectedFillColor = {
                                color: style.getFill().getColor(),
                                width: null
                            }
                        }

                        scope.plotOl.open = true; //默认编辑栏展开

                        var extent = feature.getGeometry().getExtent();
                        var pos = [extent[2], (extent[1] + extent[3]) / 2];

                        if (!label) {
                            $.get("plugin/OpenLayers/p-ol3/overlay/editOverlay.html", function (data) {
                                var element = '<div class="sucPlotTemplate">' + data + '</div>';
                                label = createOverlay($compile(element)(scope), pos, "editLay");
                                map.addOverlay(label);
                                feature.set("plotLay", label);
                            });
                        } else {
                            feature.set("plotLay", label);
                            label.setPosition(pos);
                            $(".sucPlotTemplate").removeClass("hidden");
                        }

                        scope.$apply();
                    }

                    function createTextLay(feature, type) {
                        var textLay;
                        var extent = feature.getGeometry().getExtent();
                        var pos = [extent[2], (extent[1] + extent[3]) / 2];
                        var id = "textLay" + scope.textLays.length;
                        scope.textLays.push({
                            id: id,
                            map: map,
                            pos: pos,
                            feature: feature,
                            type: type
                        });
                        //feature.set("plotLay",id);
                        scope.$apply();
                    }

                    /**
                     * 鼠标移动事件处理函数
                     * @param {ol.MapBrowserEvent} evt
                     */
                    var pointerMoveHandler = function (evt) {
                        if (evt.dragging) {
                            return;
                        }

                        //判断是否在绘制设置相应的帮助提示信息
                        if (sketch) {
                            $(helpTooltipElement).addClass('hidden');
                        } else if (helpTooltipElement) {
                            helpTooltipElement.innerHTML = helpTooltipHtml; //将提示信息设置到对话框中显示
                            helpTooltip.setPosition(evt.coordinate); //设置帮助提示框的位置
                            $(helpTooltipElement).removeClass('hidden'); //移除帮助提示框的隐藏样式进行显示
                        }
                    };
                    var listenerMove = map.on('pointermove', pointerMoveHandler); //地图容器绑定鼠标移动事件，动态显示帮助提示框内容
                    //地图绑定鼠标移出事件，鼠标移出时为帮助提示框设置隐藏样式
                    $(map.getViewport()).on('mouseout', function () {
                        $(helpTooltipElement).addClass('hidden');
                    });
                    $(map.getViewport()).on('contextmenu', function (e) { //右键取消绘制
                        plotDraw.deactivate(); //取消绘制
                        sketch = true;

                        scope.type = ""; //通过type控制父作用域菜单的选中状态
                        scope.$apply();
                        return false; //禁用右键菜单
                    });

                    // 初始化标绘绘制工具，添加绘制结束事件响应
                    plotDraw = new P.PlotDraw(map);
                    plotDraw.on(P.Event.PlotDrawEvent.DRAW_END, onDrawEnd, false, this);

                    // 初始化标绘编辑工具
                    plotEdit = new P.PlotEdit(map);

                    // 设置标绘符号显示的默认样式
                    var stroke = new ol.style.Stroke({
                        color: '#2058A5',
                        width: 2
                    });
                    var fill = new ol.style.Fill({
                        color: [32, 88, 165, 0.4]
                    });
                    drawStyle = new ol.style.Style({
                        fill: fill,
                        stroke: stroke
                    });

                    // 绘制好的标绘符号，添加到FeatureOverlay显示。
                    drawOverlay = createVectorLayer();

                    drawOverlay.setMap(map);

                    var listenerClick = map.on('singleclick', function (e) {

                        // set sketch
                        sketch = true;
                        $(helpTooltipElement).addClass('hidden');

                        if (plotDraw.isDrawing()) {
                            return;
                        }

                        var feature = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                            return feature;
                        });
                        if (feature) {
                            if (!scope.isEdit) { //不编辑
                                return false;
                            }
                            // 开始编辑
                            plotEdit.activate(feature);

                            var plotType = feature.get("plotType");
                            if (plotType != "text") {
                                createEditLay(feature);
                            }
                        } else {
                            // 结束编辑
                            plotEdit.deactivate();
                            $(".sucPlotTemplate").addClass("hidden");

                            //文字备注菜单收缩
                            scope.plotOl.closeTextMenu = true;
                        }
                    });

                    // 指定标绘类型，开始绘制。
                    function activate(type) {
                        // 结束编辑
                        plotEdit.deactivate();
                        $(".sucPlotTemplate").addClass("hidden");

                        plotDraw.activate(type);

                        // set sketch
                        sketch = null; //激活绘制之后，开始绘制之前，显示提示语
                    };

                    // 绘制结束后，添加到FeatureOverlay显示。
                    function onDrawEnd(event) {
                        var feature = event.feature;

                        if (scope.type.indexOf("text") != -1) { //文字备注
                            feature.setStyle(
                                new ol.style.Style({
                                    image: new ol.style.Circle({
                                        radius: 5,
                                        fill: new ol.style.Fill({
                                            color: 'rgba(32, 88, 165, 0)'
                                        }),
                                        stroke: new ol.style.Stroke({
                                            color: 'rgba(32, 88, 165, 0)',
                                        })
                                    })
                                    /*image: new ol.style.Icon({
	                            		anchor: [0.5, 1],
	          	                        src: "plugin/OpenLayers/p-ol3/img/move.png"
	                            	})*/
                                })
                            );

                            feature.set("plotType", "text");
                            if (scope.isEdit) {
                                if (scope.type.indexOf("textVertical") != -1) {
                                    createTextLay(feature, 1); //竖排 弹框
                                } else {
                                    createTextLay(feature, 0); //横排 弹框
                                }
                            }

                        } else if (scope.type.indexOf("icon") != -1) {
                            var style;
                            if (attrs.icon) {
                                style = new ol.style.Style({
                                    image: new ol.style.Icon({
                                        anchor: [0.5, 1],
                                        color: [32, 88, 165],
                                        src: attrs.icon
                                    })
                                });
                            } else {
                                style = markerDefaults;
                            }
                            feature.setStyle(style);

                            feature.set("plotType", "text");
                        } else {
                            if (scope.type.endWith("line")) { //线状模板
                                feature.setStyle(
                                    new ol.style.Style({
                                        stroke: new ol.style.Stroke({
                                            color: '#2058A5',
                                            width: 3,
                                            lineDash: [8, 12]
                                        })
                                    })
                                );
                                feature.set("plotType", "line");
                            } else { //面状模板
                                feature.setStyle(drawStyle);

                                feature.set("plotType", "area");
                            }

                            if (scope.isEdit) {
                                createEditLay(feature); //弹框
                            }
                        }
                        drawOverlay.getSource().addFeature(feature);

                        if (scope.isEdit) {
                            // 开始编辑
                            plotEdit.activate(feature);
                        }

                        //绘制结束，通过type控制父作用域菜单的选中状态
                        scope.type = "";
                        scope.drawEnd({
                            feature: feature
                        }); //回调函数
                        scope.$apply();
                    }

                    //删除
                    scope.delObj = function () {
                        if (drawOverlay && plotEdit && plotEdit.activePlot) {
                            drawOverlay.getSource().removeFeature(plotEdit.activePlot);

                            //隐藏弹框
                            $(".sucPlotTemplate").addClass("hidden");

                            plotEdit.deactivate();
                        }
                    }
                    scope.plotOl.delTextLay = function (textLay, feature) {
                        drawOverlay.getSource().removeFeature(feature);
                        map.removeOverlay(textLay);
                        plotEdit.deactivate();
                    }

                    String.prototype.endWith = function (endStr) {
                        var d = this.length - endStr.length;
                        return (d >= 0 && this.lastIndexOf(endStr) == d)
                    }

                    scope.$watch("type", function (nval) {
                        if (nval) {
                            helpTooltipHtml = "点击左键开始绘制，双击结束绘制，右键退出";
                            var shape = nval;
                            if (shape.indexOf("text") != -1 || shape.indexOf("icon") != -1) {
                                helpTooltipHtml = "可左键点击想要标记的位置，右键退出";
                            }
                            if (shape.indexOf("-") != -1) {
                                shape = shape.split("-")[0];
                            }
                            activate(P.PlotTypes[shape]);

                            //激活绘制时，地图上显示帮助提示信息
                            createHelpTooltip("plot"); //创建帮助提示框
                        }
                    });

                    //更改样式
                    scope.$watch("plotOl.selectedFillColor", function (nval, oval) {
                        if (drawOverlay && plotEdit && plotEdit.activePlot) {
                            //所有feature共用drawStyle,所以改变其中一个feature的样式的时候，应该再创建一个对象，以免影响其他feature
                            var tempStyle = angular.copy(plotEdit.activePlot.getStyle());
                            var fill = tempStyle.getFill();
                            if (fill) {
                                fill.setColor(nval.color);
                                plotEdit.activePlot.setStyle(tempStyle);
                            }
                            drawOverlay.getSource().refresh();
                        }
                    }, true)
                    scope.$watch("plotOl.selectedStrokeColor", function (nval, oval) {
                        if (drawOverlay && plotEdit && plotEdit.activePlot) {
                            var tempStyle = angular.copy(plotEdit.activePlot.getStyle());
                            var stroke = tempStyle.getStroke();
                            if (stroke) {
                                stroke.setColor(nval.color);
                                stroke.setWidth(parseFloat(nval.width));
                                plotEdit.activePlot.setStyle(tempStyle);
                            }
                            drawOverlay.getSource().refresh();
                        }
                    }, true)
                });
            }
        }
	}]).controller('SucPlotController', ['$scope', function ($scope) {
        var ctrl = this;
        this.open = true;
        this.type = "line";
	}]);
    angular.module('openlayers-directive').directive('plotText', ["$q", "olMapDefaults", "olHelpers", function ($q, olMapDefaults, olHelpers) {
        return {
            restrict: 'E',
            require: '^olPlot',
            scope: {
                properties: "="
            },
            replace: true,
            templateUrl: 'plugin/OpenLayers/p-ol3/overlay/textOverlay.html',
            link: function (scope, element, attrs, plotOl) {
                //添加overlay
                var textLay = olHelpers.createOverlay(element, scope.properties.pos, scope.properties.id);
                scope.properties.map.addOverlay(textLay);

                scope.status = 0;
                var type = scope.properties.type; //1为竖排
                scope.note = {
                    edit: true
                }

                if (type == 1) {
                    scope.$watch("note.edit", function (n, o) {
                        if (!n) {
                            scope.status = 1; //文字样式竖排
                        } else {
                            scope.status = 0;
                        }
                    });
                }

                $(scope.properties.map.getViewport()).on('click', function (e) {
                    if (!scope.note.edit) {
                        scope.close = true;
                        scope.$apply();
                    }
                });

                //拖拽
                element.parent().draggable({
                    handle: ".angularOl_textOuter",
                    stop: function () {
                        var left = parseFloat(element.parent().css("left"));
                        var top = parseFloat(element.parent().css("top"));
                        var coordinate = scope.properties.map.getCoordinateFromPixel([left, top]);
                        textLay.setPosition(coordinate);
                    }
                });
                //$(".angularOl_textOuter").resizable();

                //删除
                scope.delTextlay = function () {
                    plotOl.delTextLay(textLay, scope.properties.feature);
                }

                scope.$on('$destroy', function () {
                    scope.delTextlay();
                });
            }
        }
	}]);

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
            template: '<div><ol-path coords="{{trackLine.coords}}" ol-style="trackLine.style" type="LineString" ng-repeat="trackLine in carTrack.trackLines"></ol-path>' +
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
                if (attrs.carProperties) {
                    angular.extend(scope.carTrack.car, JSON.parse(attrs.carProperties));
                }

                olScope.getMap().then(function (map) {
                    var mapDefaults = olMapDefaults.getDefaults(olScope);
                    var viewProjection = mapDefaults.view.projection;

                    //绘制某个点与其上个点之间的路段
                    scope.drawRoute = function (index) {
                        if (index < 1 || index > points.length - 1) {
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
                        var s = getGreatCircleDistance(projection, line.coords[1], line.coords[0]);
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
    angular.module('openlayers-directive').directive('olView', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function ($log, $q, olData, olMapDefaults, olHelpers) {
        return {
            restrict: 'A',
            scope: false,
            replace: false,
            require: 'openlayers',
            link: function (scope, element, attrs, controller) {
                var olScope = controller.getOpenlayersScope();
                var isNumber = olHelpers.isNumber;
                var safeApply = olHelpers.safeApply;
                var createView = olHelpers.createView;

                olScope.getMap().then(function (map) {
                    var defaults = olMapDefaults.getDefaults(olScope);
                    var view = olScope.view;

                    if (!view.projection) {
                        view.projection = defaults.view.projection;
                    }

                    if (!view.maxZoom) {
                        view.maxZoom = defaults.view.maxZoom;
                    }

                    if (!view.minZoom) {
                        view.minZoom = defaults.view.minZoom;
                    }

                    if (!view.rotation) {
                        view.rotation = defaults.view.rotation;
                    }

                    var mapView = createView(view);
                    map.setView(mapView);

                    olScope.$watchCollection('view', function (view) {
                        if (isNumber(view.rotation)) {
                            mapView.setRotation(view.rotation);
                        }
                    });

                    var rotationEventKey = mapView.on('change:rotation', function () {
                        safeApply(olScope, function (scope) {
                            scope.view.rotation = map.getView().getRotation();
                        });
                    });

                    olScope.$on('$destroy', function () {
                        ol.Observable.unByKey(rotationEventKey);
                    });

                });
            }
        };
	}]);
    angular.module('openlayers-directive').service('olData', ["$log", "$q", function ($log, $q) {

        var maps = {};
        var clickDefer;

        var setResolvedDefer = function (d, mapId) {
            var id = obtainEffectiveMapId(d, mapId);
            d[id].resolvedDefer = true;
        };

        var getUnresolvedDefer = function (d, mapId) {
            var id = obtainEffectiveMapId(d, mapId);
            var defer;

            if (!angular.isDefined(d[id]) || d[id].resolvedDefer === true) {
                defer = $q.defer();
                d[id] = {
                    defer: defer,
                    resolvedDefer: false
                };
            } else {
                defer = d[id].defer;
            }
            return defer;
        };

        var getDefer = function (d, mapId) {
            var id = obtainEffectiveMapId(d, mapId);
            var defer;

            if (!angular.isDefined(d[id]) || d[id].resolvedDefer === false) {
                defer = getUnresolvedDefer(d, mapId);
            } else {
                defer = d[id].defer;
            }
            return defer;
        };

        this.setMap = function (olMap, scopeId) {
            var defer = getUnresolvedDefer(maps, scopeId);
            defer.resolve(olMap);
            setResolvedDefer(maps, scopeId);
        };

        this.getMap = function (scopeId) {
            var defer = getDefer(maps, scopeId);
            return defer.promise;
        };

        function obtainEffectiveMapId(d, mapId) {
            var id;
            var i;
            if (!angular.isDefined(mapId)) {
                if (Object.keys(d).length === 1) {
                    for (i in d) {
                        if (d.hasOwnProperty(i)) {
                            id = i;
                        }
                    }
                } else if (Object.keys(d).length === 0) {
                    id = 'main';
                } else {
                    $log.error('[AngularJS - Openlayers] - You have more than 1 map on the DOM, ' +
                        'you must provide the map ID to the olData.getXXX call');
                }
            } else {
                id = mapId;
            }
            return id;
        }

        this.resetMap = function (scopeId) {
            if (angular.isDefined(maps[scopeId])) {
                delete maps[scopeId];
            }
        };
	}]);
    angular.module('openlayers-directive').factory('olHelpers', ["$q", "$log", "$http", "$compile", "olData", function ($q, $log, $http, $compile, olData) {

        var isDefined = function (value) {
            return angular.isDefined(value);
        };

        var isDefinedAndNotNull = function (value) {
            return angular.isDefined(value) && value !== null;
        };

        /*16进制颜色转为RGB格式*/
        var colorRgb = function (sColor) {
            if (sColor instanceof Array) {
                return sColor.join(",");
            }
            //十六进制颜色值的正则表达式  
            var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
            var sColor = sColor.toLowerCase();
            if (sColor && reg.test(sColor)) {
                if (sColor.length === 4) {
                    var sColorNew = "#";
                    for (var i = 1; i < 4; i += 1) {
                        sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
                    }
                    sColor = sColorNew;
                }

                //处理六位的颜色值  
                var sColorChange = [];
                for (var i = 1; i < 7; i += 2) {
                    sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
                }
                return sColorChange.join(",");
            } else if (sColor && sColor.indexOf("rgb") != -1) {
                var temp = sColor.split("(")[1];
                temp = temp.slice(0, temp.length - 1);
                sColor = temp;
                return sColor;
            } else {
                return null;
            }
        };

        /*
         * xiarx 20170519
         * 将监控地图事件全部放入服务的setevent方法中，这样对于是否要监控地图事件变成可控的了
         * 虽然一般都是要监控的。。
         */
        var resolutionEventKey, featureOverlay;
        var setClickDefault = function (map, feature, scope, evt) {
            if (feature) {
                removeOverlay(map, null, "clickLabel"); //移除弹框

                var tempInfo = feature.get("featureInfo"),
                    featureType, featureData;
                if (tempInfo) {
                    featureType = tempInfo.type;
                    featureData = tempInfo.data;
                }

                if (feature.get("features")) { //汇聚而成的点位
                    featureType = "clusterFeature";
                }

                /*
                 * marker，可以有点击回调(ngClick)，因为它是单一的点，可以直接触发element的click事件
                 * 而 olcluster，oltrack暂时不会有，因为他们是群体，无法去触发某个点的click事件。因此涉及到了子scope访问父scope方法的问题
                 */
                if (featureType === "marker") { //marker
                    var data = featureData;
                    if (data.ngClick && (evt.type === 'singleclick' || evt.type === 'touchend')) { //如果ol-marker元素上绑定了click事件，不再触发map的click事件
                        var ele = data.ngClick;
                        ele.triggerHandler('click');
                        evt.preventDefault();
                        evt.stopPropagation();
                        return;
                    }
                    if (data.clickLabel && (data.clickLabel.title || data.clickLabel.message || data.clickLabel.url)) { //marker点击显示标签

                        //data里面要包含coord，lat，lon，label
                        setClickMarker(feature, map, data, scope.$parent);
                    }
                } else if (featureType === "clusterFeature") { //cluster
                    var features = feature.get("features");
                    var len = features.length;
                    if (len == 1) {
                        var feature1 = features[0];
                        var data = feature1.get("featureInfo").data;
                        if (data.ngClick && (evt.type === 'click' || evt.type === 'touchend')) { //如果单个点对象上绑定了click事件，不再触发map的click事件
                            var ele = data.ngClick;
                            ele.triggerHandler('click');
                            evt.preventDefault();
                            evt.stopPropagation();
                            return;
                        }

                        if (data.clickLabel && (data.clickLabel.title || data.clickLabel.message || data.clickLabel.url)) { //marker点击显示标签
                            setClickMarker(feature1, map, data, scope.$parent);
                        }
                    } else {
                        var temp = feature.get("multiFeatureEvent");
                        if (!temp || temp.indexOf("over") == -1) {
                            var overLabel = feature.get("overLay");
                            if (overLabel && overLabel.getMap()) {
                                if (overLabel.get("overLabel")) { //如果已经悬浮产生列表
                                    overLabel.unset("overLabel");
                                    overLabel.set("clickLabel", "true"); //悬浮弹框变点击弹框
                                }
                            }

                            var view = map.getView();
                            if (resolutionEventKey) {
                                ol.Observable.unByKey(resolutionEventKey);
                            }
                            resolutionEventKey = view.on("change:resolution", function () {
                                removeOverlay(map, null, "clickLabel");
                            });
                        }
                    }
                } else if (featureType === "esriFeature") {

                }
            } else { //点中空白处，移除所有overlay
                removeOverlay(map, null, "clickLabel");
            }
        }

        var setMoveDefault = function (map, feature, scope) {
            var viewProjection = map.getView().getProjection().getCode();
            if (feature) { //选中feature
                removeOverlay(map, null, "overLabel"); //移除弹框

                var tempInfo = feature.get("featureInfo"),
                    featureType, featureData;
                if (tempInfo) {
                    featureType = tempInfo.type;
                    featureData = tempInfo.data;
                }

                if (feature.get("features")) { //汇聚而成的点位
                    featureType = "clusterFeature";
                }

                if (featureType === "marker") { //marker
                    var data = featureData;
                    if (data.overLabel && (data.overLabel.title || data.overLabel.message || data.overLabel.url)) { //marker悬浮显示标签
                        setOverMarker(feature, map, data, scope.$parent);
                    }
                } else if (featureType === "clusterFeature") { //cluster
                    var features = feature.get("features");
                    var len = features.length;
                    if (len == 1) { //单点
                        var feature1 = features[0];
                        var data = feature1.get("featureInfo").data;

                        if (data.overLabel && (data.overLabel.title || data.overLabel.message || data.overLabel.url)) { //marker悬浮显示标签
                            setOverMarker(feature1, map, data, scope.$parent);
                        }
                    } else { //汇聚而成的点位
                        var temp = feature.get("multiFeatureEvent ");

                        if (features[0].get("id") == undefined) {
                            return;
                        }
                        if (!temp || temp.indexOf("over") == -1) {
                            if (feature.get("overLay") && feature.get("overLay").getMap()) { //标签已经存在，就不在产生标签
                                if (feature.get("overLay").get("clickLabel")) { //区别点击产生的标签和悬浮产生的标签
                                    return;
                                }
                            }

                            var data = angular.copy(features[0].get("featureInfo").data);
                            var ulHtml = "<ul class='featureList'>";
                            for (var i = 0; i < len; i++) {
                                var id = features[i].get("id");
                                var data = angular.copy(features[i].get("featureInfo").data);
                                var coord = ol.proj.transform(data.coord, data.projection, viewProjection).join(",");
                                ulHtml += "<li ng-click='locateFeature(\"" + id + "\",\"" + coord + "\")'>" + features[i].get("id") + "</li>";
                            }
                            ulHtml += "</ul>";
                            data.overLabel = {
                                classNm: "clusterOver",
                                title: "",
                                placement: "right",
                                message: ulHtml,
                                id: ""
                            }
                            setOverMarker(feature, map, data, scope);
                        }
                    }
                } else if (featureType === "esriFeature") {
                    //创建临时图层，放置选中状态feature
                    if (featureOverlay) {
                        featureOverlay.setMap(null);
                    }
                    featureOverlay = new ol.layer.Vector({
                        source: new ol.source.Vector()
                    });
                    featureOverlay.setMap(map); //在最顶层
                    var selectStyle = createStyle({
                        fill: {
                            color: [255, 0, 0, 0.1]
                        },
                        stroke: {
                            color: '#f00',
                            width: 1
                        }
                    });
                    featureOverlay.setStyle(selectStyle);
                    featureOverlay.getSource().addFeature(feature);
                }
            } else { //空白处，移除所有鼠标悬浮产生的overlay
                removeOverlay(map, null, "overLabel");
                if (featureOverlay) {
                    featureOverlay.setMap(null);
                }
            }
        }
        var setEvent = function (map, eventType, scope) {
            map.on(eventType, function (event) {
                var coord = event.coordinate;
                var proj = map.getView().getProjection().getCode();
                if (proj === 'pixel') {
                    coord = coord.map(function (v) {
                        return parseInt(v, 10);
                    });
                }

                /*xiarx 20161108*/
                var feature = "";
                if (eventType == "singleclick") {
                    feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
                        return feature;
                    });
                    setClickDefault(map, feature, scope, event); //点击到不同种类的feature【marker，cluster，null】后的表现形式
                } else if (eventType == "pointermove") {
                    var pixel = map.getEventPixel(event.originalEvent);
                    feature = map.forEachFeatureAtPixel(pixel, function (feature) {
                        return feature;
                    });
                    scope.locateFeature = function (id, coord) {
                        //移除弹框
                        removeOverlay(map, null, "clickLabel");
                        if (resolutionEventKey) {
                            ol.Observable.unByKey(resolutionEventKey);
                        }

                        var intCoord = [];
                        intCoord = coord.split(",").map(function (data) {
                            return +data;
                        });
                        var view = map.getView();
                        var curZoom = map.getView().getZoom();
                        var zoom = curZoom < 18 ? 18 : (curZoom + 2);
                        view.animate({
                            center: intCoord
                        }, {
                            zoom: zoom
                        });
                    }
                    setMoveDefault(map, feature, scope); //鼠标悬浮到不同种类的feature【marker，cluster，null】后的表现形式
                }

                feature = feature ? feature : "";

                scope.$emit('openlayers.map.' + eventType, {
                    'coord': coord,
                    'projection': proj,
                    'event': event,
                    "feature": feature
                });
            });

        };

        var coordinateTransform = function (coord, coordinate1, coordinate2) {
            var result = ol.proj.transform(coord, coordinate1, coordinate2);
            return result;
        };

        /*
         * xiarx 20170223
         * 监测地图事件，生成弹框
         */


        /*
         * xiarx 20161124
         * 生成弹框
         */
        var createOverlay = function (element, pos, id, stopEvent) {
            element.css('display', 'block');
            var ov = new ol.Overlay({
                id: id,
                position: pos,
                element: element[0],
                positioning: 'top-left',
                insertFirst: false,
                stopEvent: stopEvent == undefined ? true : stopEvent
            });

            return ov;
        };

        /*
         * xiarx 20170223
         * 移除弹框
         */
        var removeOverlay = function (map, id, property) {
            var layArr = map.getOverlays();
            var len = layArr.getLength();
            if (!id && !property) { //移除所有
                layArr.clear();
            } else if (id) {
                for (var i = len - 1; i >= 0; i--) {
                    if (layArr.item(i).getId() == id) {
                        layArr.removeAt(i);
                    }
                }
            } else {
                for (var i = len - 1; i >= 0; i--) {
                    if (layArr.item(i).get(property)) {
                        layArr.removeAt(i);
                    }
                }
            }
        };

        //计算两个经纬度坐标之间的距离
        var EARTH_RADIUS = 6378137.0; //单位M
        var PI = Math.PI;

        function getRad(d) {
            return d * PI / 180.0;
        }

        /**
         * caculate the great circle distance
         * @param {Object} lat1
         * @param {Object} lng1
         * @param {Object} lat2
         * @param {Object} lng2
         */

        function getGreatCircleDistance(projection, point1, point2) {
            var point1 = ol.proj.transform(point1, projection, 'EPSG:4326'),
                point2 = ol.proj.transform(point2, projection, 'EPSG:4326');
            var lat1 = point1[0],
                lng1 = point1[1],
                lat2 = point2[0],
                lng2 = point2[1];
            var radLat1 = getRad(lat1);
            var radLat2 = getRad(lat2);

            var a = radLat1 - radLat2;
            var b = getRad(lng1) - getRad(lng2);

            var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
            s = s * EARTH_RADIUS;
            s = Math.round(s * 10000) / 10000.0;

            return s;
        }

        function getGeodesicDistance(projection, point1, point2) {
            var point1 = ol.proj.transform(point1, projection, 'EPSG:4326'),
                point2 = ol.proj.transform(point2, projection, 'EPSG:4326');
            var wgs84Sphere = new ol.Sphere(6378137); //定义一个球对象
            var s = wgs84Sphere.haversineDistance(point1, point2);

            return s;
        }

        /*
         * xiarx 20161124
         * marker事件绑定
         * data = {
            projection: "EPSG:4326",
            lat: 0,
            lon: 0,
            label:{
                classNm: "",
                title: "",
                placement: "top",
                message: "",
                id: ""
            }
         }
         */
        var setClickMarker = function (feature, map, data, scope) {
            if (data.keepOneOverlayVisible) { //点击时，只保留一个显示，移除以前所有overlay
                removeOverlay(map, null, "clickLabel");
            }

            var tempData = angular.copy(data);
            tempData.label = angular.copy(data.clickLabel);
            scope.selectedLayid = tempData.label.id; //传值
            if (tempData.label.url) {
                $.get(tempData.label.url, function (response) {
                    tempData.label.message = response;
                    var label = setMarkerEvent(feature, map, tempData, scope);
                    label.set("clickLabel", "true"); //与其他的弹出框区分
                });
            } else {
                var label = setMarkerEvent(feature, map, tempData, scope);
                label.set("clickLabel", "true"); //与其他的弹出框区分
            }
        }
        var setOverMarker = function (feature, map, data, scope) {
            //悬浮时，先移除其它的弹出框
            removeOverlay(map, null, "overLabel");

            var tempData = angular.copy(data);
            tempData.label = angular.copy(data.overLabel);
            tempData.label.classNm = "featureOver " + tempData.label.classNm;
            if (tempData.label.url) {
                $.get(tempData.label.url, function (response) {
                    tempData.label.message = response;

                    var label = setMarkerEvent(feature, map, tempData, scope);
                    label.set("overLabel", "true"); //与其他的弹出框区分
                });
            } else {
                var label = setMarkerEvent(feature, map, tempData, scope);
                label.set("overLabel", "true"); //与其他的弹出框区分
            }
        }
        var setMarkerEvent = function (feature, map, data, scope) {
            var viewProjection = map.getView().getProjection().getCode();
            var pos;
            if (data.coord && data.coord.length == 2) {
                pos = ol.proj.transform(data.coord, data.projection, viewProjection);
            } else {
                pos = ol.proj.transform([data.lon, data.lat], data.projection, viewProjection);
            }

            //如果没有内容，就不产生弹出框
            if (!(data.label && data.label.message)) {
                return;
            }

            if (!data.label.placement) {
                data.label.placement = "top";
            }
            var divHtml = "<div class='popover " + data.label.placement + "' style='display:block;background-color: white;'>";
            if (data.label.placement == "top") {
                divHtml += "<div class='arrow' style='left:50%;'></div>";
            } else {
                divHtml += "<div class='arrow'></div>";
            }
            if (data.label.title) {
                divHtml += "<h3 class='popover-title'>" + data.label.title + "</h3>";
            }
            divHtml += "<div class='popover-content'>" + data.label.message + "</div>";

            var layEle = $('<div class="' + data.label.classNm + '"></div>');

            var ele = $compile(divHtml)(scope);
            angular.element(layEle).html(ele);
            if (feature) {
                scope.$apply();
            }

            /* if (data.label.placement == "top") {
                 document.body.append(layEle[0]);
                 var specialClass = data.label.classNm.split(" ");
                 if (specialClass.length == 2) {
                     specialClass = specialClass[1];
                 } else {
                     specialClass = specialClass[0];
                 }
                 var w = $("." + specialClass + " .popover").outerWidth(),
                     h = $("." + specialClass + " .popover").outerHeight();
                 $("." + specialClass + " .popover").css({
                     "top": -1 * h - 30 + "px",
                     "left": -1 * w / 2 + "px"
                 });
             }*/

            var label = createOverlay(layEle, pos, data.label.id, data.label.stopEvent);

            map.addOverlay(label);
            map.renderSync();

            //关联起feature和overLay
            if (feature) {
                feature.set("overLay", label);
            }

            return label;
        };


        var bingImagerySets = [
	      'Road',
	      'Aerial',
	      'AerialWithLabels',
	      'collinsBart',
	      'ordnanceSurvey'
	    ];

        var getControlClasses = function () {
            return {
                attribution: ol.control.Attribution,
                fullscreen: ol.control.FullScreen,
                mouseposition: ol.control.MousePosition,
                overviewmap: ol.control.OverviewMap,
                rotate: ol.control.Rotate,
                scaleline: ol.control.ScaleLine,
                zoom: ol.control.Zoom,
                zoomslider: ol.control.ZoomSlider,
                zoomtoextent: ol.control.ZoomToExtent
            };
        };

        /* author xiarx 20161019
         * interaction
         */
        var getInteractionClasses = function () {
            return {
                dragZoom: ol.interaction.DragZoom,
                draw: ol.interaction.Draw,
                select: ol.interaction.Select,
                modify: ol.interaction.Modify
            };
        };

        var mapQuestLayers = ['osm', 'sat', 'hyb'];

        var esriBaseLayers = ['World_Imagery', 'World_Street_Map', 'World_Topo_Map',
	                          'World_Physical_Map', 'World_Terrain_Base',
	                          'Ocean_Basemap', 'NatGeo_World_Map'];

        var styleMap = {
            'style': ol.style.Style,
            'fill': ol.style.Fill,
            'stroke': ol.style.Stroke,
            'circle': ol.style.Circle,
            'icon': ol.style.Icon,
            'image': ol.style.Image,
            'regularshape': ol.style.RegularShape,
            'text': ol.style.Text,
            'atlasManager': ol.style.AtlasManager
        };

        var optionalFactory = function (style, Constructor) {
            if (Constructor && style instanceof Constructor) {
                return style;
            } else if (Constructor) {
                return new Constructor(style);
            } else {
                return style;
            }
        };

        //Parse the style tree calling the appropriate constructors.
        //The keys in styleMap can be used and the OpenLayers constructors can be
        //used directly.
        var createStyle = function recursiveStyle(data, styleName) {
            var style;
            if (!styleName) {
                styleName = 'style';
                style = data;
            } else {
                style = data[styleName];
            }
            //Instead of defining one style for the layer, we've been given a style function
            //to apply to each feature.
            if (styleName === 'style' && data instanceof Function) {
                return data;
            }

            if (!(style instanceof Object)) {
                return style;
            }

            var styleObject;
            if (Object.prototype.toString.call(style) === '[object Object]') {
                styleObject = {};
                var styleConstructor = styleMap[styleName];
                if (styleConstructor && style instanceof styleConstructor) {
                    return style;
                }
                Object.getOwnPropertyNames(style).forEach(function (val, idx, array) {
                    //Consider the case
                    //image: {
                    //  circle: {
                    //     fill: {
                    //       color: 'red'
                    //     }
                    //   }
                    //
                    //An ol.style.Circle is an instance of ol.style.Image, so we do not want to construct
                    //an Image and then construct a Circle.  We assume that if we have an instanceof
                    //relationship, that the JSON parent has exactly one child.
                    //We check to see if an inheritance relationship exists.
                    //If it does, then for the parent we create an instance of the child.
                    var valConstructor = styleMap[val];
                    if (styleConstructor && valConstructor &&
                        valConstructor.prototype instanceof styleMap[styleName]) {
                        console.assert(array.length === 1, 'Extra parameters for ' + styleName);
                        styleObject = recursiveStyle(style, val);
                        return optionalFactory(styleObject, valConstructor);
                    } else {
                        styleObject[val] = recursiveStyle(style, val);

                        // if the value is 'text' and it contains a String, then it should be interpreted
                        // as such, 'cause the text style might effectively contain a text to display
                        if (val !== 'text' && typeof styleObject[val] !== 'string') {
                            styleObject[val] = optionalFactory(styleObject[val], styleMap[val]);
                        }
                    }
                });
            } else {
                styleObject = style;
            }
            return optionalFactory(styleObject, styleMap[styleName]);
        };

        var detectLayerType = function (layer) {
            if (layer.type) {
                return layer.type;
            } else {
                switch (layer.source.type) {
                    case 'ImageWMS':
                        return 'Image';
                    case 'ImageStatic':
                    case 'ImageArcGISRest':
                        return 'Image';
                    case 'GeoJSON':
                    case 'JSONP':
                    case 'TopoJSON':
                    case 'KML':
                    case 'WKT':
                    case 'EsriJson':
                        return 'Vector';
                    case 'TileVector':
                        return 'TileVector';
                    default:
                        return 'Tile';
                }
            }
        };

        var createProjection = function (view) {
            var oProjection;

            switch (view.projection) {
                case 'pixel':
                    if (!isDefined(view.extent)) {
                        $log.error('[AngularJS - Openlayers] - You must provide the extent of the image ' +
                            'if using pixel projection');
                        return;
                    }
                    oProjection = new ol.proj.Projection({
                        code: 'pixel',
                        units: 'pixels',
                        extent: view.extent
                    });
                    break;
                default:
                    oProjection = new ol.proj.get(view.projection);
                    break;
            }

            return oProjection;
        };

        var isValidStamenLayer = function (layer) {
            return ['watercolor', 'terrain', 'toner'].indexOf(layer) !== -1;
        };

        var createSource = function (source, projection, onLayerCreatedFn) {
            var oSource;
            var url;
            var geojsonFormat = new ol.format.GeoJSON(); // used in various switch stmnts below

            switch (source.type) {
                case 'MapBox':
                    if (!source.mapId || !source.accessToken) {
                        $log.error('[AngularJS - Openlayers] - MapBox layer requires the map id and the access token');
                        return;
                    }
                    url = 'http://api.tiles.mapbox.com/v4/' + source.mapId + '/{z}/{x}/{y}.png?access_token=' +
                        source.accessToken;

                    var pixelRatio = window.devicePixelRatio;

                    if (pixelRatio > 1) {
                        url = url.replace('.png', '@2x.png');
                    }

                    oSource = new ol.source.XYZ({
                        url: url,
                        tileLoadFunction: source.tileLoadFunction,
                        attributions: createAttribution(source),
                        tilePixelRatio: pixelRatio > 1 ? 2 : 1
                    });
                    break;
                case 'MapBoxStudio':
                    if (!source.mapId || !source.accessToken || !source.userId) {
                        $log.error('[AngularJS - Openlayers] - MapBox Studio layer requires the map id' +
                            ', user id  and the access token');
                        return;
                    }
                    url = 'https://api.mapbox.com/styles/v1/' + source.userId +
                        '/' + source.mapId + '/tiles/{z}/{x}/{y}?access_token=' +
                        source.accessToken;

                    oSource = new ol.source.XYZ({
                        url: url,
                        tileLoadFunction: source.tileLoadFunction,
                        attributions: createAttribution(source),
                        tileSize: source.tileSize || [512, 512]
                    });
                    break;
                case 'ImageWMS':
                    if (!source.url || !source.params) {
                        $log.error('[AngularJS - Openlayers] - ImageWMS Layer needs ' +
                            'valid server url and params properties');
                    }
                    oSource = new ol.source.ImageWMS({
                        url: source.url,
                        imageLoadFunction: source.imageLoadFunction,
                        attributions: createAttribution(source),
                        crossOrigin: (typeof source.crossOrigin === 'undefined') ? 'anonymous' : source.crossOrigin,
                        params: deepCopy(source.params),
                        ratio: source.ratio
                    });
                    break;

                case 'TileWMS':
                    if ((!source.url && !source.urls) || !source.params) {
                        $log.error('[AngularJS - Openlayers] - TileWMS Layer needs ' +
                            'valid url (or urls) and params properties');
                    }

                    var wmsConfiguration = {
                        tileLoadFunction: source.tileLoadFunction,
                        crossOrigin: (typeof source.crossOrigin === 'undefined') ? 'anonymous' : source.crossOrigin,
                        params: deepCopy(source.params),
                        attributions: createAttribution(source)
                    };

                    if (source.serverType) {
                        wmsConfiguration.serverType = source.serverType;
                    }

                    if (source.url) {
                        wmsConfiguration.url = source.url;
                    }

                    if (source.urls) {
                        wmsConfiguration.urls = source.urls;
                    }

                    oSource = new ol.source.TileWMS(wmsConfiguration);
                    break;

                case 'WMTS':
                    if ((!source.url && !source.urls) || !source.tileGrid) {
                        $log.error('[AngularJS - Openlayers] - WMTS Layer needs valid url ' +
                            '(or urls) and tileGrid properties');
                    }

                    var wmtsConfiguration = {
                        tileLoadFunction: source.tileLoadFunction,
                        projection: projection,
                        layer: source.layer,
                        attributions: createAttribution(source),
                        matrixSet: (source.matrixSet === 'undefined') ? projection : source.matrixSet,
                        format: (source.format === 'undefined') ? 'image/jpeg' : source.format,
                        requestEncoding: (source.requestEncoding === 'undefined') ?
                            'KVP' : source.requestEncoding,
                        tileGrid: new ol.tilegrid.WMTS({
                            origin: source.tileGrid.origin,
                            resolutions: source.tileGrid.resolutions,
                            matrixIds: source.tileGrid.matrixIds
                        }),
                        style: (source.style === 'undefined') ? 'normal' : source.style
                    };

                    if (isDefined(source.url)) {
                        wmtsConfiguration.url = source.url;
                    }

                    if (isDefined(source.urls)) {
                        wmtsConfiguration.urls = source.urls;
                    }

                    oSource = new ol.source.WMTS(wmtsConfiguration);
                    break;

                case 'OSM':
                    oSource = new ol.source.OSM({
                        tileLoadFunction: source.tileLoadFunction,
                        attributions: createAttribution(source)
                    });

                    if (source.url) {
                        oSource.setUrl(source.url);
                    }

                    break;
                case 'BingMaps':
                    if (!source.key) {
                        $log.error('[AngularJS - Openlayers] - You need an API key to show the Bing Maps.');
                        return;
                    }

                    var bingConfiguration = {
                        key: source.key,
                        tileLoadFunction: source.tileLoadFunction,
                        attributions: createAttribution(source),
                        imagerySet: source.imagerySet ? source.imagerySet : bingImagerySets[0],
                        culture: source.culture
                    };

                    if (source.maxZoom) {
                        bingConfiguration.maxZoom = source.maxZoom;
                    }

                    oSource = new ol.source.BingMaps(bingConfiguration);
                    break;

                case 'MapQuest':
                    if (!source.layer || mapQuestLayers.indexOf(source.layer) === -1) {
                        $log.error('[AngularJS - Openlayers] - MapQuest layers needs a valid \'layer\' property.');
                        return;
                    }

                    oSource = new ol.source.MapQuest({
                        attributions: createAttribution(source),
                        layer: source.layer
                    });

                    break;

                case 'EsriBaseMaps':
                    if (!source.layer || esriBaseLayers.indexOf(source.layer) === -1) {
                        $log.error('[AngularJS - Openlayers] - ESRI layers needs a valid \'layer\' property.');
                        return;
                    }

                    var _urlBase = 'http://services.arcgisonline.com/ArcGIS/rest/services/';
                    var _url = _urlBase + source.layer + '/MapServer/tile/{z}/{y}/{x}';

                    oSource = new ol.source.XYZ({
                        attributions: createAttribution(source),
                        tileLoadFunction: source.tileLoadFunction,
                        url: _url
                    });

                    break;

                case 'TileArcGISRest':
                    if (!source.url) {
                        $log.error('[AngularJS - Openlayers] - TileArcGISRest Layer needs valid url');
                    }

                    oSource = new ol.source.TileArcGISRest({
                        attributions: createAttribution(source),
                        tileLoadFunction: source.tileLoadFunction,
                        url: source.url
                    });

                    break;

                case 'GeoJSON':
                    if (!(source.geojson || source.url)) {
                        $log.error('[AngularJS - Openlayers] - You need a geojson ' +
                            'property to add a GeoJSON layer.');
                        return;
                    }

                    if (isDefined(source.url)) {
                        oSource = new ol.source.Vector({
                            format: new ol.format.GeoJSON(),
                            url: source.url
                        });
                    } else {
                        oSource = new ol.source.Vector();

                        var projectionToUse = projection;
                        var dataProjection; // Projection of geojson data
                        if (isDefined(source.geojson.projection)) {
                            dataProjection = new ol.proj.get(source.geojson.projection);
                        } else {
                            dataProjection = projection; // If not defined, features will not be reprojected.
                        }

                        var features = geojsonFormat.readFeatures(
                            source.geojson.object, {
                                featureProjection: projectionToUse.getCode(),
                                dataProjection: dataProjection.getCode()
                            });

                        oSource.addFeatures(features);
                    }

                    break;
                case 'EsriJson':
                    if (!source.url) {
                        $log.error('[AngularJS - Openlayers] - You need a esrijson ' +
                            'property to add a EsriJSON layer.');
                        return;
                    }

                    var esrijsonFormat = new ol.format.EsriJSON();
                    oSource = new ol.source.Vector({
                        loader: function (extent, resolution, projection) {
                            console.log(2);
                            var url = source.url;
                            $.ajax({
                                url: url,
                                dataType: 'jsonp',
                                success: function (response) {
                                    if (response.error) {
                                        alert(response.error.message + '\n' +
                                            response.error.details.join('\n'));
                                    } else {
                                        // dataProjection will be read from document
                                        var features = esrijsonFormat.readFeatures(response, {
                                            featureProjection: projection
                                        });

                                        features.forEach(function (feature) {
                                            feature.set("featureInfo", {
                                                type: "esriFeature",
                                                data: feature
                                            });
                                            if (source.style && angular.isFunction(source.style)) {
                                                var style = source.style(feature);
                                                feature.setStyle(style);
                                            }
                                            if (source.style == "random") {
                                                var styles = {
                                                    style0: new ol.style.Style({
                                                        stroke: new ol.style.Stroke({
                                                            color: '#FF0000',
                                                            width: 2
                                                        })
                                                    }),
                                                    style1: new ol.style.Style({
                                                        stroke: new ol.style.Stroke({
                                                            color: '#FFFF00',
                                                            width: 2
                                                        })
                                                    }),
                                                    style2: new ol.style.Style({
                                                        stroke: new ol.style.Stroke({
                                                            color: '#00FF00',
                                                            width: 2
                                                        })
                                                    }),
                                                    style3: new ol.style.Style({
                                                        stroke: new ol.style.Stroke({
                                                            color: '#FF7D00',
                                                            width: 2
                                                        })
                                                    }),
                                                    style4: new ol.style.Style({
                                                        stroke: new ol.style.Stroke({
                                                            color: 'green',
                                                            width: 2
                                                        })
                                                    })
                                                }
                                                var random = Math.random();
                                                if (random < 0.1)
                                                    feature.setStyle(styles["style0"]);
                                                else if (random < 0.3)
                                                    feature.setStyle(styles["style1"]);
                                                else
                                                    feature.setStyle(styles["style2"]);
                                            }
                                        });

                                        if (features.length > 0) {
                                            oSource.addFeatures(features);
                                            if (onLayerCreatedFn) {
                                                onLayerCreatedFn({
                                                    oSource: oSource
                                                })
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });

                    break;
                case 'WKT':
                    if (!(source.wkt) && !(source.wkt.data)) {
                        $log.error('[AngularJS - Openlayers] - You need a WKT ' +
                            'property to add a WKT format vector layer.');
                        return;
                    }

                    oSource = new ol.source.Vector();
                    var wktFormatter = new ol.format.WKT();
                    var wktProjection; // Projection of wkt data
                    if (isDefined(source.wkt.projection)) {
                        wktProjection = new ol.proj.get(source.wkt.projection);
                    } else {
                        wktProjection = projection; // If not defined, features will not be reprojected.
                    }

                    var wktFeatures = wktFormatter.readFeatures(
                        source.wkt.data, {
                            featureProjection: projection.getCode(),
                            dataProjection: wktProjection.getCode()
                        });

                    oSource.addFeatures(wktFeatures);
                    break;

                case 'JSONP':
                    if (!(source.url)) {
                        $log.error('[AngularJS - Openlayers] - You need an url properly configured to add a JSONP layer.');
                        return;
                    }

                    if (isDefined(source.url)) {
                        oSource = new ol.source.ServerVector({
                            format: geojsonFormat,
                            loader: function ( /*extent, resolution, projection*/ ) {
                                var url = source.url +
                                    '&outputFormat=text/javascript&format_options=callback:JSON_CALLBACK';
                                $http.jsonp(url, {
                                        cache: source.cache
                                    })
                                    .success(function (response) {
                                        oSource.addFeatures(geojsonFormat.readFeatures(response));
                                    })
                                    .error(function (response) {
                                        $log(response);
                                    });
                            },
                            projection: projection
                        });
                    }
                    break;
                case 'TopoJSON':
                    if (!(source.topojson || source.url)) {
                        $log.error('[AngularJS - Openlayers] - You need a topojson ' +
                            'property to add a TopoJSON layer.');
                        return;
                    }

                    if (source.url) {
                        oSource = new ol.source.Vector({
                            format: new ol.format.TopoJSON(),
                            url: source.url
                        });
                    } else {
                        oSource = new ol.source.Vector(angular.extend(source.topojson, {
                            format: new ol.format.TopoJSON()
                        }));
                    }
                    break;
                case 'TileJSON':
                    oSource = new ol.source.TileJSON({
                        url: source.url,
                        attributions: createAttribution(source),
                        tileLoadFunction: source.tileLoadFunction,
                        crossOrigin: 'anonymous'
                    });
                    break;

                case 'TileVector':
                    if (!source.url || !source.format) {
                        $log.error('[AngularJS - Openlayers] - TileVector Layer needs valid url and format properties');
                    }
                    oSource = new ol.source.VectorTile({
                        url: source.url,
                        projection: projection,
                        attributions: createAttribution(source),
                        tileLoadFunction: source.tileLoadFunction,
                        format: source.format,
                        tileGrid: new ol.tilegrid.createXYZ({
                            maxZoom: source.maxZoom || 19
                        })
                    });
                    break;

                case 'TileTMS':
                    if (!source.url || !source.tileGrid) {
                        $log.error('[AngularJS - Openlayers] - TileTMS Layer needs valid url and tileGrid properties');
                    }
                    oSource = new ol.source.TileImage({
                        url: source.url,
                        maxExtent: source.maxExtent,
                        attributions: createAttribution(source),
                        tileLoadFunction: source.tileLoadFunction,
                        tileGrid: new ol.tilegrid.TileGrid({
                            origin: source.tileGrid.origin,
                            resolutions: source.tileGrid.resolutions
                        }),
                        tileUrlFunction: function (tileCoord) {

                            var z = tileCoord[0];
                            var x = tileCoord[1];
                            var y = tileCoord[2]; //(1 << z) - tileCoord[2] - 1;

                            if (x < 0 || y < 0) {
                                return '';
                            }

                            var url = source.url + z + '/' + x + '/' + y + '.png';

                            return url;
                        }
                    });
                    break;
                case 'TileImage':
                    oSource = new ol.source.TileImage({
                        url: source.url,
                        attributions: createAttribution(source),
                        tileLoadFunction: source.tileLoadFunction,
                        tileGrid: new ol.tilegrid.TileGrid({
                            origin: source.tileGrid.origin, // top left corner of the pixel projection's extent
                            resolutions: source.tileGrid.resolutions
                        }),
                        tileUrlFunction: function (tileCoord /*, pixelRatio, projection*/ ) {
                            var z = tileCoord[0];
                            var x = tileCoord[1];
                            var y = -tileCoord[2] - 1;
                            var url = source.url
                                .replace('{z}', z.toString())
                                .replace('{x}', x.toString())
                                .replace('{y}', y.toString());
                            return url;
                        }
                    });
                    break;
                case 'KML':
                    var extractStyles = source.extractStyles || false;
                    oSource = new ol.source.Vector({
                        url: source.url,
                        format: new ol.format.KML(),
                        radius: source.radius,
                        extractStyles: extractStyles
                    });
                    break;
                case 'Stamen':
                    if (!source.layer || !isValidStamenLayer(source.layer)) {
                        $log.error('[AngularJS - Openlayers] - You need a valid Stamen layer.');
                        return;
                    }
                    oSource = new ol.source.Stamen({
                        tileLoadFunction: source.tileLoadFunction,
                        layer: source.layer
                    });
                    break;
                case 'ImageStatic':
                    if (!source.url || !angular.isArray(source.imageSize) || source.imageSize.length !== 2) {
                        $log.error('[AngularJS - Openlayers] - You need a image URL to create a ImageStatic layer.');
                        return;
                    }

                    oSource = new ol.source.ImageStatic({
                        url: source.url,
                        attributions: createAttribution(source),
                        imageSize: source.imageSize,
                        projection: projection,
                        imageExtent: source.imageExtent ? source.imageExtent : projection.getExtent(),
                        imageLoadFunction: source.imageLoadFunction
                    });
                    break;
                case 'XYZ':
                    if (!source.url && !source.tileUrlFunction) {
                        $log.error('[AngularJS - Openlayers] - XYZ Layer needs valid url or tileUrlFunction properties');
                    }
                    oSource = new ol.source.XYZ({
                        url: source.url,
                        attributions: createAttribution(source),
                        minZoom: source.minZoom,
                        maxZoom: source.maxZoom,
                        projection: source.projection,
                        tileUrlFunction: source.tileUrlFunction,
                        tileLoadFunction: source.tileLoadFunction
                    });
                    break;
                case 'Zoomify':
                    if (!source.url || !angular.isArray(source.imageSize) || source.imageSize.length !== 2) {
                        $log.error('[AngularJS - Openlayers] - Zoomify Layer needs valid url and imageSize properties');
                    }
                    oSource = new ol.source.Zoomify({
                        url: source.url,
                        size: source.imageSize
                    });
                    break;
            }

            // log a warning when no source could be created for the given type
            if (!oSource) {
                $log.warn('[AngularJS - Openlayers] - No source could be found for type "' + source.type + '"');
            }

            return oSource;
        };

        var deepCopy = function (oldObj) {
            var newObj = oldObj;
            if (oldObj && typeof oldObj === 'object') {
                newObj = Object.prototype.toString.call(oldObj) === '[object Array]' ? [] : {};
                for (var i in oldObj) {
                    newObj[i] = deepCopy(oldObj[i]);
                }
            }
            return newObj;
        };

        var createAttribution = function (source) {
            var attributions = [];
            if (isDefined(source.attribution)) {
                attributions.unshift(new ol.Attribution({
                    html: source.attribution
                }));
            }
            return attributions;
        };

        var createGroup = function (name) {
            var olGroup = new ol.layer.Group();
            olGroup.set('name', name);

            return olGroup;
        };

        var getGroup = function (layers, name) {
            var layer;

            angular.forEach(layers, function (l) {
                if (l instanceof ol.layer.Group && l.get('name') === name) {
                    layer = l;
                    return;
                }
            });

            return layer;
        };

        var addLayerBeforeMarkers = function (layers, layer) {
            var markersIndex;
            for (var i = 0; i < layers.getLength(); i++) {
                var l = layers.item(i);

                if (l.get('markers')) {
                    markersIndex = i;
                    break;
                }
            }

            if (isDefined(markersIndex)) {
                var markers = layers.item(markersIndex);
                layer.index = markersIndex;
                layers.setAt(markersIndex, layer);
                markers.index = layers.getLength();
                layers.push(markers);
            } else {
                layer.index = layers.getLength();
                layers.push(layer);
            }

        };

        var removeLayer = function (layers, index) {

            /*
             * xiarx 20161121
             * 此处逻辑错误，olmarker图层并无编号，当移除marker图层时，此处的index作为序号就不再准确
             * 故注释掉原先的，更改为新的
             */

            /*  layers.removeAt(index);
              for (var i = index; i < layers.getLength(); i++) {
                  var l = layers.item(i);
                  if (l === null) {
                      layers.insertAt(i, null);
                      break;
                  } else {
                      l.index = i;
                  }
              }*/
            layers.forEach(function (layer, no) {
                if (layer.index === index) {
                    layers.removeAt(no);
                    return;
                }
            })
        };

        return {
            // Determine if a reference is defined
            isDefined: isDefined,

            // Determine if a reference is a number
            isNumber: function (value) {
                return angular.isNumber(value);
            },

            createView: function (view) {
                var projection = createProjection(view);

                var viewConfig = {
                    projection: projection,
                    maxZoom: view.maxZoom,
                    minZoom: view.minZoom
                };

                if (view.center) {
                    viewConfig.center = view.center;
                }
                if (view.extent) {
                    viewConfig.extent = view.extent;
                }
                if (view.zoom) {
                    viewConfig.zoom = view.zoom;
                }
                if (view.resolutions) {
                    viewConfig.resolutions = view.resolutions;
                }

                return new ol.View(viewConfig);
            },

            // Determine if a reference is defined and not null
            isDefinedAndNotNull: isDefinedAndNotNull,

            colorRgb: colorRgb,

            //解除地图事件监控
            mapUnByKey: function (eventKey) {
                ol.Observable.unByKey(eventKey);
            },

            // Determine if a reference is a string
            isString: function (value) {
                return angular.isString(value);
            },

            // Determine if a reference is an array
            isArray: function (value) {
                return angular.isArray(value);
            },

            // Determine if a reference is an object
            isObject: function (value) {
                return angular.isObject(value);
            },

            // Determine if two objects have the same properties
            equals: function (o1, o2) {
                return angular.equals(o1, o2);
            },

            isValidCenter: function (center) {
                return angular.isDefined(center) &&
                    (typeof center.autodiscover === 'boolean' ||
                        angular.isNumber(center.lat) && angular.isNumber(center.lon) ||
                        (angular.isArray(center.coord) && center.coord.length === 2 &&
                            angular.isNumber(center.coord[0]) && angular.isNumber(center.coord[1])) ||
                        (angular.isArray(center.bounds) && center.bounds.length === 4 &&
                            angular.isNumber(center.bounds[0]) && angular.isNumber(center.bounds[1]) &&
                            angular.isNumber(center.bounds[1]) && angular.isNumber(center.bounds[2])));
            },

            safeApply: function ($scope, fn) {
                var phase = $scope.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    $scope.$eval(fn);
                } else {
                    $scope.$apply(fn);
                }
            },

            isSameCenterOnMap: function (center, map) {
                var urlProj = center.projection || 'EPSG:4326';
                var urlCenter = [center.lon, center.lat];
                var mapProj = map.getView().getProjection();
                var mapCenter = ol.proj.transform(map.getView().getCenter(), mapProj, urlProj);
                var zoom = map.getView().getZoom();
                if (mapCenter[1].toFixed(4) === urlCenter[1].toFixed(4) &&
                    mapCenter[0].toFixed(4) === urlCenter[0].toFixed(4) &&
                    zoom === center.zoom) {
                    return true;
                }
                return false;
            },

            setCenter: function (view, projection, newCenter, map) {
                var coord = [newCenter.lon, newCenter.lat];
                var coord1 = ol.proj.transform(coord, newCenter.projection, projection);

                if (newCenter.projection === projection) {
                    if (map && view.getCenter()) {
                        view.animate({
                            center: coord,
                            duration: 150
                        });
                    } else {
                        view.setCenter(coord);
                    }
                } else {
                    if (map && view.getCenter()) {
                        view.animate({
                            center: coord1,
                            duration: 150
                        });
                    } else {
                        view.setCenter(coord1);
                    }
                }
            },

            setZoom: function (view, zoom, map) {
                view.animate({
                    zoom: zoom,
                    duration: 150
                });
            },

            isBoolean: function (value) {
                return typeof value === 'boolean';
            },

            createStyle: createStyle,

            setMapEvents: function (events, map, scope) {
                if (isDefined(events) && angular.isArray(events.map)) {
                    for (var i in events.map) {
                        var event = events.map[i];
                        setEvent(map, event, scope);
                    }
                }
            },

            getGreatCircleDistance: getGreatCircleDistance,
            getGeodesicDistance: getGeodesicDistance,
            setClickMarker: setClickMarker,
            setOverMarker: setOverMarker,
            setMarkerEvent: setMarkerEvent,
            coordinateTransform: coordinateTransform,

            setVectorLayerEvents: function (events, map, scope, layerName) {
                if (isDefined(events) && angular.isArray(events.layers)) {
                    angular.forEach(events.layers, function (eventType) {
                        angular.element(map.getViewport()).on(eventType, function (evt) {
                            var pixel = map.getEventPixel(evt);
                            var feature = map.forEachFeatureAtPixel(pixel, function (feature, olLayer) {
                                // only return the feature if it is in this layer (based on the name)
                                return (isDefinedAndNotNull(olLayer) && olLayer.get('name') === layerName) ? feature : null;
                            });
                            if (isDefinedAndNotNull(feature)) {
                                scope.$emit('openlayers.layers.' + layerName + '.' + eventType, feature, evt);
                            }
                        });
                    });
                }
            },

            setViewEvents: function (events, map, scope) {
                if (isDefined(events) && angular.isArray(events.view)) {
                    var view = map.getView();
                    angular.forEach(events.view, function (eventType) {
                        view.on(eventType, function (event) {
                            scope.$emit('openlayers.view.' + eventType, view, event);
                        });
                    });
                }
            },

            detectLayerType: detectLayerType,

            createLayer: function (layer, projection, name, onLayerCreatedFn) {
                var oLayer;
                var type = detectLayerType(layer);

                // handle function overloading. 'name' argument may be
                // our onLayerCreateFn since name is optional
                if (typeof (name) === 'function' && !onLayerCreatedFn) {
                    onLayerCreatedFn = name;
                    name = undefined; // reset, otherwise it'll be used later on
                }

                var oSource = createSource(layer.source, projection, onLayerCreatedFn);
                if (!oSource) {
                    return;
                }

                // Manage clustering
                if ((type === 'Vector') && layer.clustering) {
                    oSource = new ol.source.Cluster({
                        source: oSource,
                        distance: layer.clusteringDistance
                    });
                }

                var layerConfig = {
                    source: oSource
                };

                // ol.layer.Layer configuration options
                if (isDefinedAndNotNull(layer.opacity)) {
                    layerConfig.opacity = layer.opacity;
                }
                if (isDefinedAndNotNull(layer.visible)) {
                    layerConfig.visible = layer.visible;
                }
                if (isDefinedAndNotNull(layer.extent)) {
                    layerConfig.extent = layer.extent;
                }
                if (isDefinedAndNotNull(layer.zIndex)) {
                    layerConfig.zIndex = layer.zIndex;
                }
                if (isDefinedAndNotNull(layer.minResolution)) {
                    layerConfig.minResolution = layer.minResolution;
                }
                if (isDefinedAndNotNull(layer.maxResolution)) {
                    layerConfig.maxResolution = layer.maxResolution;
                }

                switch (type) {
                    case 'Image':
                        oLayer = new ol.layer.Image(layerConfig);
                        break;
                    case 'Tile':
                        oLayer = new ol.layer.Tile(layerConfig);
                        break;
                    case 'Heatmap':
                        oLayer = new ol.layer.Heatmap(layerConfig);
                        break;
                    case 'Vector':
                        oLayer = new ol.layer.Vector(layerConfig);
                        break;
                    case 'TileVector':
                        oLayer = new ol.layer.VectorTile(layerConfig);
                        break;
                }

                // set a layer name if given
                if (isDefined(name)) {
                    oLayer.set('name', name);
                } else if (isDefined(layer.name)) {
                    oLayer.set('name', layer.name);
                }

                // set custom layer properties if given
                if (isDefined(layer.customAttributes)) {
                    for (var key in layer.customAttributes) {
                        oLayer.set(key, layer.customAttributes[key]);
                    }
                }

                // invoke the onSourceCreated callback
                if (onLayerCreatedFn) {
                    onLayerCreatedFn({
                        oLayer: oLayer
                    });
                }

                return oLayer;
            },

            createVectorLayer: function () {
                return new ol.layer.Vector({
                    source: new ol.source.Vector(),
                    zIndex: arguments[0] || 0
                });
            },

            /* author xiarx 20161201
             * cluster
             */
            createClusterLayer: function () {
                return new ol.layer.Vector({
                    source: new ol.source.Cluster({
                        distance: parseInt(arguments[1] || 20),
                        source: new ol.source.Vector()
                    }),
                    zIndex: arguments[0] || 0
                });
            },

            notifyCenterUrlHashChanged: function (scope, center, search) {
                if (center.centerUrlHash) {
                    var centerUrlHash = center.lat.toFixed(4) + ':' + center.lon.toFixed(4) + ':' + center.zoom;
                    if (!isDefined(search.c) || search.c !== centerUrlHash) {
                        scope.$emit('centerUrlHash', centerUrlHash);
                    }
                }
            },

            getControlClasses: getControlClasses,

            detectControls: function (controls) {
                var actualControls = {};
                var controlClasses = getControlClasses();

                controls.forEach(function (control) {
                    for (var i in controlClasses) {
                        if (control instanceof controlClasses[i]) {
                            actualControls[i] = control;
                        }
                    }
                });

                return actualControls;
            },

            /* author xiarx 20161019
             * interaction
             */
            getInteractionClasses: getInteractionClasses,

            createFeature: function (data, viewProjection) {
                var geometry;

                switch (data.type) {
                    case 'Polygon':
                        geometry = new ol.geom.Polygon(data.coords);
                        break;

                        /*xiarx 20161120   添加线的绘制*/
                    case 'LineString':
                        geometry = new ol.geom.LineString(data.coords);
                        break;
                    case 'MultiLineString':
                        geometry = new ol.geom.MultiLineString(data.coords);
                        break;
                    case 'Point':
                        geometry = new ol.geom.Point(data.coords);
                        break;
                    case 'Circle':
                        geometry = new ol.geom.Circle(data.coords, data.radius);
                        break;
                    default:
                        if (data.coords) {
                            geometry = new ol.geom.Point(data.coords);
                        } else if (data.lat && data.lon) {
                            geometry = new ol.geom.Point([data.lon, data.lat]);
                        }
                        break;
                }

                if (isDefined(data.projection) && data.projection !== 'pixel') {
                    geometry = geometry.transform(data.projection, viewProjection);
                }

                var feature = new ol.Feature({
                    id: data.id,
                    geometry: geometry
                });

                if (isDefined(data.style)) {
                    var style = createStyle(data.style);
                    feature.setStyle(style);
                }
                return feature;
            },

            addLayerBeforeMarkers: addLayerBeforeMarkers,

            getGroup: getGroup,

            addLayerToGroup: function (layers, layer, name) {
                var groupLayer = getGroup(layers, name);

                if (!isDefined(groupLayer)) {
                    groupLayer = createGroup(name);
                    addLayerBeforeMarkers(layers, groupLayer);
                }

                layer.set('group', name);
                addLayerBeforeMarkers(groupLayer.getLayers(), layer);
            },

            removeLayerFromGroup: function (layers, layer, name) {
                var groupLayer = getGroup(layers, name);
                layer.set('group');
                removeLayer(groupLayer.getLayers(), layer.index);
            },

            removeLayer: removeLayer,

            insertLayer: function (layers, index, layer) {
                if (layers.getLength() < index) {
                    // fill up with "null layers" till we get to the desired index
                    while (layers.getLength() < index) {
                        var nullLayer = new ol.layer.Image();
                        nullLayer.index = layers.getLength(); // add index which will be equal to the length in this case
                        layers.push(nullLayer);
                    }
                    layer.index = index;
                    layers.push(layer);
                } else {
                    layer.index = index;
                    layers.insertAt(layer.index, layer);
                    for (var i = index + 1; i < layers.getLength(); i++) {
                        var l = layers.item(i);
                        if (l === null) {
                            layers.removeAt(i);
                            break;
                        } else {
                            l.index = i;
                        }
                    }
                }
            },

            createOverlay: createOverlay,
            removeOverlay: removeOverlay
        };
	}]);
    angular.module('openlayers-directive').factory('olMapDefaults', ["$q", "olHelpers", function ($q, olHelpers) {

        var base64icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAGmklEQVRYw' +
            '7VXeUyTZxjvNnfELFuyIzOabermMZEeQC/OclkO49CpOHXOLJl/CAURuYbQi3KLgEhbrhZ1aDwmaoGq' +
            'KII6odATmH/scDFbdC7LvFqOCc+e95s2VG50X/LLm/f4/Z7neY/ne18aANCmAr5E/xZf1uDOkTcGcWR' +
            '6hl9247tT5U7Y6SNvWsKT63P58qbfeLJG8M5qcgTknrvvrdDbsT7Ml+tv82X6vVxJE33aRmgSyYtcWV' +
            'MqX97Yv2JvW39UhRE2HuyBL+t+gK1116ly06EeWFNlAmHxlQE0OMiV6mQCScusKRlhS3QLeVJdl1+23' +
            'h5dY4FNB3thrbYboqptEFlphTC1hSpJnbRvxP4NWgsE5Jyz86QNNi/5qSUTGuFk1gu54tN9wuK2wc3o' +
            '+Wc13RCmsoBwEqzGcZsxsvCSy/9wJKf7UWf1mEY8JWfewc67UUoDbDjQC+FqK4QqLVMGGR9d2wurKzq' +
            'Bk3nqIT/9zLxRRjgZ9bqQgub+DdoeCC03Q8j+0QhFhBHR/eP3U/zCln7Uu+hihJ1+bBNffLIvmkyP0g' +
            'pBZWYXhKussK6mBz5HT6M1Nqpcp+mBCPXosYQfrekGvrjewd59/GvKCE7TbK/04/ZV5QZYVWmDwH1mF' +
            '3xa2Q3ra3DBC5vBT1oP7PTj4C0+CcL8c7C2CtejqhuCnuIQHaKHzvcRfZpnylFfXsYJx3pNLwhKzRAw' +
            'AhEqG0SpusBHfAKkxw3w4627MPhoCH798z7s0ZnBJ/MEJbZSbXPhER2ih7p2ok/zSj2cEJDd4CAe+5W' +
            'YnBCgR2uruyEw6zRoW6/DWJ/OeAP8pd/BGtzOZKpG8oke0SX6GMmRk6GFlyAc59K32OTEinILRJRcha' +
            'h8HQwND8N435Z9Z0FY1EqtxUg+0SO6RJ/mmXz4VuS+DpxXC3gXmZwIL7dBSH4zKE50wESf8qwVgrP1E' +
            'IlTO5JP9Igu0aexdh28F1lmAEGJGfh7jE6ElyM5Rw/FDcYJjWhbeiBYoYNIpc2FT/SILivp0F1ipDWk' +
            '4BIEo2VuodEJUifhbiltnNBIXPUFCMpthtAyqws/BPlEF/VbaIxErdxPphsU7rcCp8DohC+GvBIPJS/' +
            'tW2jtvTmmAeuNO8BNOYQeG8G/2OzCJ3q+soYB5i6NhMaKr17FSal7GIHheuV3uSCY8qYVuEm1cOzqdW' +
            'r7ku/R0BDoTT+DT+ohCM6/CCvKLKO4RI+dXPeAuaMqksaKrZ7L3FE5FIFbkIceeOZ2OcHO6wIhTkNo0' +
            'ffgjRGxEqogXHYUPHfWAC/lADpwGcLRY3aeK4/oRGCKYcZXPVoeX/kelVYY8dUGf8V5EBRbgJXT5QIP' +
            'hP9ePJi428JKOiEYhYXFBqou2Guh+p/mEB1/RfMw6rY7cxcjTrneI1FrDyuzUSRm9miwEJx8E/gUmql' +
            'yvHGkneiwErR21F3tNOK5Tf0yXaT+O7DgCvALTUBXdM4YhC/IawPU+2PduqMvuaR6eoxSwUk75ggqsY' +
            'J7VicsnwGIkZBSXKOUww73WGXyqP+J2/b9c+gi1YAg/xpwck3gJuucNrh5JvDPvQr0WFXf0piyt8f8/' +
            'WI0hV4pRxxkQZdJDfDJNOAmM0Ag8jyT6hz0WGXWuP94Yh2jcfjmXAGvHCMslRimDHYuHuDsy2QtHuIa' +
            'vznhbYURq5R57KpzBBRZKPJi8eQg48h4j8SDdowifdIrEVdU+gbO6QNvRRt4ZBthUaZhUnjlYObNagV' +
            '3keoeru3rU7rcuceqU1mJBxy+BWZYlNEBH+0eH4vRiB+OYybU2hnblYlTvkHinM4m54YnxSyaZYSF6R' +
            '3jwgP7udKLGIX6r/lbNa9N6y5MFynjWDtrHd75ZvTYAPO/6RgF0k76mQla3FGq7dO+cH8sKn0Vo7nDl' +
            'lwAhqwLPkxrHwWmHJOo+AKJ4rab5OgrM7rVu8eWb2Pu0Dh4eDgXoOfvp7Y7QeqknRmvcTBEyq9m/HQQ' +
            'SCSz6LHq3z0yzsNySRfMS253wl2KyRDbcZPcfJKjZmSEOjcxyi+Y8dUOtsIEH6R2wNykdqrkYJ0RV92' +
            'H0W58pkfQk7cKevsLK10Py8SdMGfXNXATY+pPbyJR/ET6n9nIfztNtZYRV9XniQu9IA2vOVgy4ir7GC' +
            'LVmmd+zjkH0eAF9Po6K61pmCXHxU5rHMYd1ftc3owjwRSVRzLjKvqZEty6cRUD7jGqiOdu5HG6MdHjN' +
            'cNYGqfDm5YRzLBBCCDl/2bk8a8gdbqcfwECu62Fg/HrggAAAABJRU5ErkJggg==';

        var _getDefaults = function () {
            return {
                view: {
                    projection: 'EPSG:3857',
                    minZoom: undefined,
                    maxZoom: undefined,
                    rotation: 0,
                    extent: undefined
                },
                center: {
                    lat: 0,
                    lon: 0,
                    zoom: 1,
                    autodiscover: false,
                    bounds: [],
                    centerUrlHash: false,
                    projection: 'EPSG:4326'
                },
                styles: {
                    path: {
                        fill: {
                            color: "rgba(255,0,0,0.2)"
                        },
                        stroke: {
                            color: 'blue',
                            width: 4
                        }
                    },
                    marker: {
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                            opacity: 0.90,
                            src: base64icon
                        })
                    },
                    feature: { /* xiarx 20161031  默认样式*/
                        fill: new ol.style.Fill({
                            color: "#0099ff"
                        }),
                        stroke: new ol.style.Stroke({
                            color: "#1F497D",
                            width: 1
                        }),
                        image: new ol.style.Circle({
                            radius: 7,
                            fill: new ol.style.Fill({
                                color: "#0099ff"
                            }),
                            stroke: new ol.style.Stroke({
                                color: "#1F497D",
                                width: 1
                            })
                        })
                    }
                },
                events: {
                    map: [],
                    markers: [],
                    layers: []
                },
                controls: {
                    attribution: true,
                    rotate: false,
                    zoom: true
                },
                interactions: {
                    mouseWheelZoom: false
                },
                renderer: 'canvas'
            };
        };

        var isDefined = olHelpers.isDefined;
        var defaults = {};

        // Get the _defaults dictionary, and override the properties defined by the user
        return {
            getDefaults: function (scope) {
                if (!isDefined(scope)) {
                    for (var i in defaults) {
                        return defaults[i];
                    }
                }
                return defaults[scope.$id];
            },

            setDefaults: function (scope) {
                var userDefaults = scope.defaults;
                var scopeId = scope.$id;
                var newDefaults = _getDefaults();

                if (isDefined(userDefaults)) {

                    if (isDefined(userDefaults.layers)) {
                        newDefaults.layers = angular.copy(userDefaults.layers);
                    }

                    if (isDefined(userDefaults.controls)) {
                        newDefaults.controls = angular.copy(userDefaults.controls);
                    }

                    if (isDefined(userDefaults.events)) {
                        newDefaults.events = angular.copy(userDefaults.events);
                    }

                    if (isDefined(userDefaults.interactions)) {
                        newDefaults.interactions = angular.copy(userDefaults.interactions);
                    }

                    if (isDefined(userDefaults.renderer)) {
                        newDefaults.renderer = userDefaults.renderer;
                    }

                    if (isDefined(userDefaults.view)) {
                        newDefaults.view.maxZoom = userDefaults.view.maxZoom || newDefaults.view.maxZoom;
                        newDefaults.view.minZoom = userDefaults.view.minZoom || newDefaults.view.minZoom;
                        newDefaults.view.projection = userDefaults.view.projection || newDefaults.view.projection;
                        newDefaults.view.extent = userDefaults.view.extent || newDefaults.view.extent;
                        newDefaults.view.resolutions = userDefaults.view.resolutions || newDefaults.view.resolutions;
                    }

                    if (isDefined(userDefaults.styles)) {
                        newDefaults.styles = angular.extend(newDefaults.styles, userDefaults.styles);
                    }

                    if (isDefined(userDefaults.loadTilesWhileAnimating)) {
                        newDefaults.loadTilesWhileAnimating = userDefaults.loadTilesWhileAnimating;
                    }

                    if (isDefined(userDefaults.loadTilesWhileInteracting)) {
                        newDefaults.loadTilesWhileInteracting = userDefaults.loadTilesWhileInteracting;
                    }
                }

                defaults[scopeId] = newDefaults;
                return newDefaults;
            }
        };
	}]);
}));
