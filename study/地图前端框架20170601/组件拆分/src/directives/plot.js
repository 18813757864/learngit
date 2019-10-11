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
                    scope.drawEnd(feature); //回调函数
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
