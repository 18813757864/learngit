app.controller("nearbyCtrl", function ($scope) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.nearby.visible = false;
    });
    $scope.mapDemo.nearby.visible = true;
});
