app.controller("heatCtrl", function ($scope, $http, $interval) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.heatLayer.visible = false;
    });
    $scope.olMap.center.lat = 2507710.958798416;
    $scope.olMap.center.lon = 12093083.761988232;
    $scope.olMap.center.zoom = 14;

    $http.get("heat.txt").then(function (data) {
        var points = [];
        data.data.forEach(function (item) {
            points.push({
                lat: item.BJDZ_LAT,
                lon: item.BJDZ_LON
            });
        });
        $scope.mapDemo.heatLayer.points = angular.copy(points);
        $scope.mapDemo.heatLayer.visible = true;
    });
});
