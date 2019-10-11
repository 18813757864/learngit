app.controller("pathCtrl", function ($scope) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.path.visible = false;
    });
    $scope.olMap.center.lat = 2506952.7451808034;
    $scope.olMap.center.lon = 12090151.920086978;
    $scope.olMap.center.zoom = 14;
    $scope.mapDemo.path.point = {
        coords: [12090151.920086978, 2506952.7451808034],
        style: {
            image: {
                circle: {
                    radius: 5,
                    fill: {
                        color: 'red'
                    },
                    stroke: {
                        color: '#fff',
                        width: 1
                    }
                }
            }
        }
    }
    $scope.mapDemo.path.point1 = {
        coords: [12087863.432306873, 2507095.011773409],
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
    $scope.mapDemo.path.line = {
        coords: [[12094926.157148575, 2505691.534214099], [12093559.845267978, 2504392.104733251]],
        style: {
            stroke: {
                color: 'blue',
                width: 2
            }
        }
    }
    $scope.mapDemo.path.mulline = {
        coords: [[[12089769.734945552, 2506150.156383809], [12091250.702368576, 2505548.2147860634], [12092292.156878963, 2506465.4591254853]], [[12087123.102841178, 2505490.887014849], [12089072.247062448, 2504334.776962036]]],
        style: {
            stroke: {
                color: 'orange',
                width: 2
            }
        }
    }
    $scope.mapDemo.path.polygon = {
        coords: [[[12089463.98683241, 2509016.544944503], [12090505.441342797, 2509016.544944503], [12090218.802486727, 2508213.9561475087], [12089549.978489231, 2508204.401518973]]],
        style: {
            fill: {
                color: 'yellow'
            },
            stroke: {
                color: 'orange',
                width: 2
            }
        }
    }
    $scope.mapDemo.path.circle = {
        coords: [12088642.288778339, 2506207.4841550235],
        style: {
            fill: {
                color: [110, 162, 228, 0.3]
            },
            stroke: {
                width: 1,
                color: [110, 162, 228]
            }
        }
    }
    $scope.mapDemo.path.visible = true;
});
