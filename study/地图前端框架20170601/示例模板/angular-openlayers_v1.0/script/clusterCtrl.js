app.controller("clusterCtrl", function ($scope, $http) {
    $scope.olMap.center.lat = 2506070.8240254084;
    $scope.olMap.center.lon = 12091899.63029865;
    $scope.olMap.center.zoom = 14;
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.clusterLayer.visible = false;
    });

    $scope.changeStyle = function (index) {
        $scope.mapDemo.clusterLayer.points = [];
        $scope.mapDemo.clusterLayer.visible = false;
        $http.get("cluster.txt").then(function (data) {
            $scope.mapDemo.clusterLayer.points = [];
            var tempArr = [];
            data.data.page.dataList.forEach(function (marker) {
                if (marker.LATITUDE && marker.LONGITUDE && marker.LATITUDE <= 90) {
                    var item = {
                        id: marker.ID,
                        lat: marker.LATITUDE,
                        lon: marker.LONGITUDE,
                        overLabel: { //悬浮显示的信息
                            id: marker.ID,
                            message: '<div style="white-space:nowrap;min-width:100px">' + marker.NAME + '</div>',
                            classNm: "pointOver",
                            placement: "right"
                        },
                        clickLabel: {
                            message: '<div style="white-space:nowrap;min-width:100px">测试点击弹框</div>',
                            classNm: "markerClk",
                            placement: "top"
                        }
                    };
                    $scope.mapDemo.clusterLayer.clusterStyle = "";
                    if (index == 2) {
                        $scope.mapDemo.clusterLayer.clusterStyle = {
                            image: {
                                circle: {
                                    radius: 4,
                                    fill: {
                                        color: "orange"
                                    }
                                }
                            }
                        };
                        item.pointStyle = {
                            image: {
                                icon: {
                                    anchor: [0.5, 1],
                                    color: "orange",
                                    opacity: 0.7,
                                    src: 'images/locate.png'
                                }
                            }
                        }
                    }
                    tempArr.push(item);
                }
            });
            $scope.mapDemo.clusterLayer.points = tempArr;
            $scope.mapDemo.clusterLayer.visible = true;
        });
    }
    $scope.changeStyle(1);
});
