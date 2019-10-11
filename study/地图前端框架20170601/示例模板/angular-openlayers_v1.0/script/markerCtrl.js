app.controller("markerCtrl", function ($scope) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.markers = [];
    });

    var markers = [];
    for (var i = 0; i < 4; i++) {
        var tempMarker = {};
        tempMarker.ID = "test" + i;
        tempMarker.LATITUDE = 2547405.3653301923 + Math.random() * 1000 - 500;
        tempMarker.LONGITUDE = 12093758.763366926 + Math.random() * 1000 - 500;
        tempMarker.projection = "EPSG:3857";
        tempMarker.NAME = "测试" + (i + 1);
        markers.push(tempMarker);
    }

    //既有点击弹框，悬浮弹框，也有一直显示的弹框的marker
    var url = "partials/marker/addrOverLay.html";
    var info = {
        marker: markers[0],
        layName: "位置信息"
    };
    var markerItem = {
        id: markers[0].ID,
        lat: markers[0].LATITUDE,
        lon: markers[0].LONGITUDE,
        projection: markers[0].projection || "EPSG:4326",
        info: info ? info : "",
        overLabel: { //悬浮显示的信息
            id: markers[0].ID,
            message: '<div style="white-space:nowrap;min-width:100px">' + markers[0].NAME + '可点击可悬浮</div>',
            classNm: "markerOver",
            placement: "right"
        },
        clickLabel: { //点击显示的信息
            id: markers[0].ID,
            title: (info && info.layName) || markers[0].NAME,
            url: url,
            classNm: "posInfoLay",
            placement: "top",
            keepOneOverlayVisible: true
        },
        style: {
            zIndex: 1,
            image: {
                icon: {
                    anchor: [0.5, 1],
                    color: "#005BFF",
                    opacity: 0.7,
                    src: 'images/locate.png'
                }
            },
            text: {
                text: 1 + "",
                offsetX: 1,
                offsetY: -22,
                font: '500 16px',
                fill: {
                    color: "white"
                }
            }
        }
    };
    $scope.mapDemo.markers.push(markerItem);
    var markerItem1 = {
        id: markers[1].ID,
        lat: markers[1].LATITUDE,
        lon: markers[1].LONGITUDE,
        projection: markers[1].projection || "EPSG:4326",
        overLabel: { //悬浮显示的信息
            id: markers[0].ID,
            message: '<div style="white-space:nowrap;min-width:100px">' + markers[1].NAME + '可悬浮</div>',
            classNm: "markerOver",
            placement: "right"
        },
        style: {
            zIndex: 2,
            image: {
                icon: {
                    anchor: [0.5, 1],
                    color: "#005BFF",
                    opacity: 0.7,
                    src: 'images/locate.png'
                }
            },
            text: {
                text: 2 + "",
                offsetX: 1,
                offsetY: -22,
                font: '500 16px',
                fill: {
                    color: "white"
                }
            }
        }
    }
    $scope.mapDemo.markers.push(markerItem1);
    var markerItem2 = {
        id: markers[2].ID,
        lat: markers[2].LATITUDE,
        lon: markers[2].LONGITUDE,
        projection: markers[2].projection || "EPSG:4326",
        label: { //直接显示的信息
            message: '测试（一直显示）',
            show: true
        },
        style: {
            image: {
                icon: {
                    anchor: [0.5, 1],
                    color: "#005BFF",
                    opacity: 0.7,
                    src: 'images/locate.png'
                }
            }
        }
    }
    $scope.mapDemo.markers.push(markerItem2);

    $scope.olMap.center.lat = 2547405.3653301923;
    $scope.olMap.center.lon = 12093758.763366926;
    $scope.olMap.center.zoom = 16;
});
app.controller("addrOverlay", function ($scope, olData) {
    /*
     * $scope的父级作用域是openlayers指令的父级$scope,也就是appCtrl
     * 并且每次点击时，都会给$scope.selectedLayid赋值clickLabel.id
     */

    var marker;
    $scope.mapDemo.markers.forEach(function (item) {
        if (item.id == $scope.selectedLayid) {
            marker = item;
            $scope.addr = angular.copy(item.info.marker);
            $scope.addr.short_name = "未知";
            return true;
        }
    });

    $scope.close = function () {
        marker.clickLabel.remove = true;
    }
})
