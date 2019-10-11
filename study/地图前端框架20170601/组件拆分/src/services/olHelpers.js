angular.module('openlayers-directive').factory('olHelpers', ["$q", "$log", "$http", "$compile", function ($q, $log, $http, $compile) {

    var isDefined = function (value) {
        return angular.isDefined(value);
    };

    var isDefinedAndNotNull = function (value) {
        return angular.isDefined(value) && value !== null;
    };

    /*16进制颜色转为RGB格式*/
    var colorRgb = function (sColor) {

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
    var resolutionEventKey, prevFeature, featureOverlay;
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
                if (data.ngClick && (evt.type === 'click' || evt.type === 'touchend')) { //如果ol-marker元素上绑定了click事件，不再触发map的click事件
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
                var style = feature.getStyle();
                var tempStyle = angular.copy(style);
                var selectStyle = createStyle({
                    fill: {
                        color: [255, 0, 0, 0.1]
                    }
                });
                if (style) {
                    if (style.getFill()) {
                        style.getFill().setColor([255, 0, 0, 0.1]);
                    } else if (style.getStroke()) {
                        style.getStroke().setColor('#f00');
                    }
                    if (prevFeature) {
                        prevFeature.feature.setStyle(tempStyle);
                    }
                } else {
                    feature.setStyle(selectStyle);
                    if (prevFeature) {
                        prevFeature.feature.setStyle(null);
                    }
                }

                prevFeature = {
                    feature: feature,
                    style: tempStyle
                };
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
            positioning: 'center-left',
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
        scope.$apply();

        var label = createOverlay(layEle, pos, data.label.id, data.label.stopEvent);

        map.addOverlay(label);

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

    var createSource = function (source, projection) {
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
                                    })

                                    if (features.length > 0) {
                                        oSource.addFeatures(features);
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
            var oSource = createSource(layer.source, projection);
            if (!oSource) {
                return;
            }

            // handle function overloading. 'name' argument may be
            // our onLayerCreateFn since name is optional
            if (typeof (name) === 'function' && !onLayerCreatedFn) {
                onLayerCreatedFn = name;
                name = undefined; // reset, otherwise it'll be used later on
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
