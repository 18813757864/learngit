/*
 * 测距
 * 改编至openlayers官网实例
 * type: "LineString", "Polygon"
 */
angular.module('openlayers-directive').directive('olMeasure', ["$log", "$q", "olMapDefaults", "$interval", "olHelpers","$compile", function ($log, $q, olMapDefaults, $interval, olHelpers,$compile) {
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
            var draw, isDraw=true, featureNum=0; // global so we can remove it later. featureNum作为feature的id
            var listenerMove, listenerClick;
            var styles = [];     //样式

            olScope.getMap().then(function (map) {
                var viewProjection = map.getView().getProjection().getCode();
	                $("canvas").css("cursor","url(./images/measure.png),auto");

                scope.$on('$destroy', function () {
	                $("canvas").css("cursor","default");
                	map.removeLayer(vector);
                    map.removeInteraction(draw);
                    
                    //移除overlay
                    var layArr = map.getOverlays();
                    var len = layArr.getLength();
                	for (var i = len - 1; i >= 0; i--) {
                        if (layArr.item(i).get("name")&&layArr.item(i).get("name").indexOf("measure")!=-1) {
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
                    helpTooltip.set("name",name);
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
                    measureTooltip.set("name",name);
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
                    distanceTooltip.set("name",name);
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
                        output = '<span>'+(Math.round(length / 1000 * 100) / 100) + '</span> ' + 'km'; //换算成KM单位
                    } else {
                        output = '<span>'+(Math.round(length * 100) / 100) + '</span> ' + 'm'; //m为单位
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
                        output = '<span>'+(Math.round(area / 1000000 * 100) / 100) + '</span> ' + 'km<sup>2</sup>'; //换算成KM单位
                    } else {
                        output = '<span>'+(Math.round(area * 100) / 100) + '</span> ' + 'm<sup>2</sup>'; //m为单位
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
                function createPointStyle(coord,id){
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
                var drawStyle = new ol.style.Style({        //绘制过程中的样式
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
                var finishedStyle =  new ol.style.Style({
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
                    	isDraw=true;
                    	featureNum++;
                        // set sketch
                        sketch = evt.feature; //绘制的要素
                        
                        //给该feature以及其overlay一个唯一标识，以便于删除
                        var id = "measure"+featureNum;
                        sketch.set("id", id);

                        /** @type {ol.Coordinate|undefined} */
                        var tooltipCoord = evt.coordinate; // 绘制的坐标
                        
                        
                    	listenerClick = map.on("click", function(evt){
                    		var coord = sketch.getGeometry().getLastCoordinate();
                    		if(typeSelect=="LineString"){
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
                            var output = "", resultValue = "";
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
                            if(listenerClick){
                            	ol.Observable.unByKey(listenerClick);
                            }
                            listenerClick = map.on("click", function(evt){
                        		if(typeSelect=="LineString"){
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
                    	isDraw=false;      //绘制结束，要素样式改变
                    	
                    	//绘制结束，测量提示框的内容变成最后结果
                        var geom = sketch.getGeometry();
                        var output = "", coords,len;
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
                            if(coords[len-1][1]>coords[len-2][1]){
                            	measureTooltip.setOffset([-5, -25]);
                            }
                            else{
                            	measureTooltip.setOffset([-5, 25]);
                            }
                        }
                        measureTooltipElement.innerHTML = output; //将测量值设置到测量工具提示框中显示
                        measureTooltipElement.className = 'tooltip tooltip-static'; //设置测量提示框的样式
                        
                        //删除LineString最后一个距离提示框，产生删除按钮
                        if(distanceTooltipElement&&distanceTooltipElement.childNodes.length!=2){             //绘制过程中没有产生节点的情况
                        	distanceTooltipElement = null; //置空测量工具提示框对象
                        }
                        createDistanceTooltip(sketch.get("id"));
                        var closeHtml = "<i class='fa fa-close' style='cursor:pointer;' ng-click='delObj(\""+sketch.get("id")+"\")'></i>";
                        var ele = $compile(closeHtml)(scope);
                        angular.element(distanceTooltipElement).html(ele);
                        
                        distanceTooltipElement.className = 'tooltip tooltip-close'; //设置删除按钮的样式
                    	distanceTooltip.setPosition(geom.getLastCoordinate());
                        
                      //根据最后一个点和倒数第二点之间的左右位置，来决定删除按钮显示位置
                        if(coords[len-1][0]>coords[len-2][0]){
                        	distanceTooltip.setOffset([10, 0]);
                        }
                        else{
                        	distanceTooltip.setOffset([-25, 0]);
                        }
                        
                        // unset sketch
                        sketch = null; //置空当前绘制的要素对象
                        // unset tooltip so that a new one can be created
                        measureTooltipElement = null; //置空测量工具提示框对象
                        createMeasureTooltip("measure"+(featureNum+1)); //重新创建一个测试工具提示框显示结果
                        ol.Observable.unByKey(listenerChange);
                        ol.Observable.unByKey(listenerClick);
                    }, this);
                }
                
                scope.$watch("type",function(nval,oval){
                	map.removeInteraction(draw);
                	typeSelect = scope.type;
                	addInteraction();
                })
                
                
                //删除feature及相关overlay
                scope.delObj = function(id){
                	var featureArr = source.getFeatures();
                	var total = featureArr.length;
                	for (var i = total - 1; i >= 0; i--) {
                		if(featureArr[i].get("id")==id){
                			source.removeFeature(featureArr[i]);
                		}
                	}
                	
                	var layArr = map.getOverlays();
                    var len = layArr.getLength();
                	for (var i = len - 1; i >= 0; i--) {
                        if (layArr.item(i).get("name")==id) {
                            layArr.removeAt(i);
                        }
                    }
                }
            });

        }

    }
}]);