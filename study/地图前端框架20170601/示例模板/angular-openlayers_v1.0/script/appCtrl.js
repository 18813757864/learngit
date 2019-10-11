app.controller("appCtrl", function ($scope) {
    $scope.olMap = {};
    angular.extend($scope.olMap, {
        map: [{
            name: "satelliteMap_base",
            source: {
                type: 'XYZ',
                url: 'http://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
            },
            visible: true
        }],
        center: {
            lat: 2547405.3653301923,
            lon: 12093758.763366926,
            projection: "EPSG:3857",
            zoom: 14
        },
        view: {
            rotation: 0,
            maxZoom: 18
        },
        defaults: {
            controls: {
                attribution: false,
                rotate: false,
                zoom: false
            },
            interactions: {
                mouseWheelZoom: true
            },
            events: {
                map: ['singleclick', 'pointermove'],
                compose: ''
            }
        },
        controls: [{ //全屏
            name: "fullscreen",
            active: true
            }, { //鹰眼
            name: "overviewmap",
            active: true,
            collapsed: false,
            label: "»",
            collapseLabel: "«",
            tipLabel: "鹰眼",
            layers: [{
                name: "satelliteMap_base",
                source: {
                    type: 'XYZ',
                    url: 'http://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
                }
                }]
            }]
    });

    /*
     *  若想要监控地图事件，需要在ol-defaults中配置events
     */
    //地图点击事件
    $scope.$on("openlayers.map.singleclick", function (e, data) {
        console.log(data.coord);
    });
    //地图悬浮事件
    $scope.$on("openlayers.map.pointermove", function (e, data) {

    });
    $scope.mapDemo = {
        regions: {
            layer: {
                source: {
                    type: 'EsriJson',
                    projection: "EPSG:4326",
                    url: 'http://172.18.21.44:8088/ggdl/FeatureServer/0/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&outFields=*&where=1=1'
                },
                style: {
                    stroke: {
                        color: "#fff",
                        width: 2
                    },
                    fill: {
                        color: [0, 0, 0, 0.1]
                    }
                }
            },
            labels: [],
            visible: false,
            regionLoaded: function () {
                console.log("图层加载完毕");
            }
        },
        path: {
            visible: false
        },
        markers: [],
        clusterLayer: {
            points: [],
            clusterStyle: "",
            visible: false
        },
        hisTrack: {
            visible: false,
            toShowLine: false,
            curIndex: 0,
            points: [],
            playStatus: 0,
            range: [0, 0],
            car: { //轨迹回放的主体的样式
                clickLabel: {
                    classNm: "markerClk",
                    message: '<div style="white-space:nowrap;min-width:100px">测试点击弹框</div>'
                },
                style: {
                    image: {
                        icon: {
                            src: 'images/car.png',
                            rotation: 0,
                            anchor: [0.5, 1]
                        }
                    }
                }
            },
            line: { //轨迹路线的样式
                style: {
                    fill: {
                        color: 'rgba(103, 58, 183, 0.5)'
                    },
                    stroke: {
                        color: 'rgba(103, 58, 183, 0.5)',
                        width: 6
                    }
                }
            }
        },
        realTrack: {
            visible: false,
            car: { //轨迹回放的主体的样式
                clickLabel: {
                    classNm: "markerClk",
                    message: '<div style="white-space:nowrap;min-width:100px">测试点击弹框</div>'
                },
                style: {
                    image: {
                        icon: {
                            src: 'images/car.png',
                            rotation: 0,
                            anchor: [0.5, 1]
                        }
                    }
                }
            },
            line: { //轨迹路线的样式
                style: {
                    fill: {
                        color: 'rgba(103, 58, 183, 0.5)'
                    },
                    stroke: {
                        color: 'rgba(103, 58, 183, 0.5)',
                        width: 6
                    }
                }
            }
        },
        heatLayer: {
            visible: false
        },
        measure: {
            type: "LineString", //测距为LineString，测面为Polygon
            start: false
        },
        plot40l3: {
            start: false,
            type: "",
            img: null,
            edit: false,
            drawEnd: function (feature) {
                /*feature.setStyle(
    new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(32, 88, 165, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(32, 88, 165, 0)',
        })
    })
);*/
            }
        },
        nearby: {
            visible: false,
            coords: [12089769.734945552, 2506752.0979815545],
            radius: 1000,
            returnFunc: function () {
                console.log($scope.mapDemo.nearby.radius + "m");
            }
        }
    }

    $scope.menu = 1;
    $scope.myCode = '<openlayers id="map1" width="100%" height="100%" ol-center="olMap.center" ol-defaults="olMap.defaults" ol-view="olMap.view" custom-layers="false"></openlayers>';
    $scope.changeMenu = function (index) {
        $scope.menu = index;
        if (index == 1) {
            $scope.myCode = '<openlayers id="map1" width="100%" height="100%" ol-center="olMap.center" ol-defaults="olMap.defaults" ol-view="olMap.view" custom-layers="false"></openlayers>';
        } else if (index == 12) {
            $scope.myCode = '<ol-interaction name="{{interaction.name}}" ng-repeat="interaction in olMap.interactions | filter: {active: true}" ol-interaction-properties="interaction"></ol-interaction>';
        } else if (index == 13) {
            $scope.myCode = '<ol-overlay coord="overlay.coord" label="overlay.label" ng-repeat="overlay in mapDemo.regions.labels" projection="EPSG:3857"></ol-overlay>';
        } else if (index == 21) {
            $scope.myCode = '<ol-path coords="{{mapDemo.path.point.coords}}" ol-style="mapDemo.path.point.style" type="Point" projection="EPSG:3857" message="测试"></ol-path>';
        } else if (index == 23) {
            $scope.myCode = '<ol-cluster points="mapDemo.clusterLayer.points" ol-style="mapDemo.clusterLayer.clusterStyle" ng-if="mapDemo.clusterLayer.visible" zindex="5"></ol-cluster>';
        } else if (index == 24) {
            $scope.myCode = '<ol-track cur-index="mapDemo.hisTrack.curIndex" range="mapDemo.hisTrack.range" show-route="mapDemo.hisTrack.toShowLine" points="{{mapDemo.hisTrack.points}}" car-properties="{{mapDemo.hisTrack.car}}" line-properties="{{mapDemo.hisTrack.line}}"></ol-track>';
        } else if (index == 25) {
            $scope.myCode = '<ol-realtrack interval="mapDemo.realTrack.interval" line-properties="{{mapDemo.realTrack.line}}" data="mapDemo.realTrack.curPoint" car-properties="{{mapDemo.realTrack.car}}" ng-if="mapDemo.realTrack.visible"></ol-realtrack>';
        }
    }
});
