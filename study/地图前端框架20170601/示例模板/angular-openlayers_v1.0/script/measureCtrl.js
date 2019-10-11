app.controller("measureCtrl", function ($scope) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.measure.start = false;
    });
    $scope.changeMenu = function (index) {
        if (index == 1) {
            $scope.mapDemo.measure.type = "LineString";
        } else {
            $scope.mapDemo.measure.type = "Polygon";
        }
    }
    $scope.changeMenu(1);
    $scope.mapDemo.measure.start = true;
});
