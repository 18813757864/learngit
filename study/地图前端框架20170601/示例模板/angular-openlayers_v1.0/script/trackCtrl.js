app.controller("trackCtrl", function ($scope, $http, $interval) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.hisTrack.visible = false;
        $interval.cancel(hisTimer);
    });
    //模拟数据
    $scope.tracks = [
        {
            timestamp: new Date(2016, 11, 22, 8, 0).getTime(),
            lon: 108.64294305647707,
            lat: 21.977798846469905,
            direction: 270,
            style: {
                image: {
                    circle: {
                        radius: 2,
                        fill: {
                            color: 'rgba(103, 58, 183, 0.5)'
                        },
                        stroke: {
                            color: 'rgba(103, 58, 183, 0.5)',
                            width: 0
                        }
                    }
                }
            }
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 3).getTime(),
            lon: 108.63894305647707,
            lat: 21.977998846469905,
            direction: 270,
            style: {
                image: {
                    circle: {
                        radius: 2,
                        fill: {
                            color: 'rgba(103, 58, 183, 0.5)'
                        },
                        stroke: {
                            color: 'rgba(103, 58, 183, 0.5)',
                            width: 0
                        }
                    }
                }
            },
            clickLabel: {
                classNm: "pointClk",
                message: '<div style="white-space:nowrap;min-width:100px">测试点击弹框</div>',
                placement: "right"
            },
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 4).getTime(),
            lon: 108.63594305647707,
            lat: 21.977998846469905,
            direction: 270,
            style: {
                image: {
                    circle: {
                        radius: 2,
                        fill: {
                            color: 'rgba(103, 58, 183, 0.5)'
                        },
                        stroke: {
                            color: 'rgba(103, 58, 183, 0.5)',
                            width: 0
                        }
                    }
                }
            }
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 8).getTime(),
            lon: 108.63594305647707,
            lat: 21.979998846469905,
            direction: 0,
            overLabel: { //悬浮显示的信息
                message: '<div style="white-space:nowrap;">108.63594305647707,21.979998846469905</div>',
                classNm: "pointOver",
                placement: "right"
            },
            style: {
                image: {
                    circle: {
                        radius: 2,
                        fill: {
                            color: 'rgba(103, 58, 183, 0.5)'
                        },
                        stroke: {
                            color: 'rgba(103, 58, 183, 0.5)',
                            width: 0
                        }
                    }
                }
            }
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 12).getTime(),
            lon: 108.63594305647707,
            lat: 21.981498846469905,
            direction: 0,
            style: {
                image: {
                    circle: {
                        radius: 2,
                        fill: {
                            color: 'rgba(103, 58, 183, 0.5)'
                        },
                        stroke: {
                            color: 'rgba(103, 58, 183, 0.5)',
                            width: 0
                        }
                    }
                }
            }
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 18).getTime(),
            lon: 108.63594305647707,
            lat: 21.984098846469905,
            direction: 0,
            style: {
                image: {
                    circle: {
                        radius: 2,
                        fill: {
                            color: 'rgba(103, 58, 183, 0.5)'
                        },
                        stroke: {
                            color: 'rgba(103, 58, 183, 0.5)',
                            width: 0
                        }
                    }
                }
            }
        },
        {
            timestamp: new Date(2016, 11, 22, 8, 28).getTime(),
            lon: 108.63594305647707,
            lat: 21.985498846469905,
            direction: 0,
            overLabel: { //悬浮显示的信息
                message: '<div style="white-space:nowrap;">108.63594305647707,21.985498846469905</div>',
                classNm: "pointOver",
                placement: "right"
            },
            style: {
                image: {
                    circle: {
                        radius: 2,
                        fill: {
                            color: 'rgba(103, 58, 183, 0.5)'
                        },
                        stroke: {
                            color: 'rgba(103, 58, 183, 0.5)',
                            width: 0
                        }
                    }
                }
            }
          }
    ];

    $scope.olMap.center.lat = 2508889.4394434216;
    $scope.olMap.center.lon = 12094078.085604772;
    $scope.olMap.center.zoom = 16;
    $scope.mapDemo.hisTrack.curIndex = 0;
    $scope.mapDemo.hisTrack.points = $scope.tracks;
    $scope.mapDemo.hisTrack.visible = true;
    //$scope.mapDemo.hisTrack.toShowLine = true;
    //$scope.mapDemo.hisTrack.range = [0, 3];
    var hisTimer = $interval(function () {
        if ($scope.mapDemo.hisTrack.curIndex < 6) {
            $scope.mapDemo.hisTrack.curIndex++;
        } else {
            $interval.cancel(hisTimer);
        }

    }, 1000);

});
