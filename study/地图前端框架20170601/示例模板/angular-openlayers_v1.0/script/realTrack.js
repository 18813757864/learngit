app.controller("realTrack", function ($scope, $http, $interval) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.realTrack.visible = false;
        $interval.cancel(hisTimer);
    });
    //模拟数据，实际情况下应是实时获取GPS数据
    $scope.tracks = [
        {
            timestamp: new Date(2016, 11, 22, 8, 0).getTime(),
            lon: 108.64294305647707,
            lat: 21.977798846469905,
            direction: 270
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 3).getTime(),
            lon: 108.63894305647707,
            lat: 21.977998846469905,
            direction: 270
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 4).getTime(),
            lon: 108.63594305647707,
            lat: 21.977998846469905,
            direction: 270
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 8).getTime(),
            lon: 108.63594305647707,
            lat: 21.979998846469905,
            direction: 0
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 12).getTime(),
            lon: 108.63594305647707,
            lat: 21.981498846469905,
            direction: 0
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 18).getTime(),
            lon: 108.63594305647707,
            lat: 21.984098846469905,
            direction: 0
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 28).getTime(),
            lon: 108.63594305647707,
            lat: 21.985498846469905,
            direction: 0
        }
    ];

    $scope.mapDemo.realTrack.interval = 1; //时间间隔，以秒为单位，最大速度设置为34m/s，间距过大，轨迹不真实，用虚线表现
    var i = 0;
    var hisTimer = $interval(function () {
        if (i < 6) {
            $scope.mapDemo.realTrack.curPoint = $scope.tracks[i];
            $scope.mapDemo.realTrack.visible = true;
            i++;
        } else {
            $interval.cancel(hisTimer);
        }

    }, 1000);
});
