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