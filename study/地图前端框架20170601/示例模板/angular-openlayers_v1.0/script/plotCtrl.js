app.controller("plotCtrl", function ($scope) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.plot40l3.start = false;
        $scope.mapDemo.plot40l3.type = "";
    });

    $scope.mapDemo.plot40l3.start = true;
    $scope.plot = {
        basicShapes: [],
        basicTypes: ['POLYLINE', 'CURVE', 'POLYGON-line', 'CLOSED_CURVE-line', 'CIRCLE-line', 'RECTANGLE-line', 'RECTANGLE', 'CIRCLE', 'LUNE', 'SECTOR',
				             'POLYGON', 'CLOSED_CURVE', 'MARKER-text', 'MARKER-textVertical', 'MARKER-icon1', 'MARKER-icon2', 'MARKER-icon3', 'MARKER-icon4',
				             'STRAIGHT_ARROW', 'ASSAULT_DIRECTION', 'DOUBLE_ARROW', 'TAILED_SQUAD_COMBAT'],
        altTxts: ['折线', '曲线', '多边形-线状', '曲线面-线状', '圆-线状', '矩形-线状', '矩形', '圆', '弧形', '扇形', '多边形', '任意区', '文字备注',
                      '文字备注-竖排', '标记地点1', '标记地点2', '标记地点3', '标记地点4', '单线箭头', '直箭头', '双箭头', '简单箭头']
    }
    for (var i = 1; i < 23; i++) {
        var flag = 1; //是否用pol3绘制
        if (i > 12) {
            flag = 0;
        }
        $scope.plot.basicShapes.push({
            src: "images/left/icons/" + i + ".png",
            type: $scope.plot.basicTypes[i - 1],
            altTxt: $scope.plot.altTxts[i - 1],
            flag: flag
        })
    }

    //标绘
    $scope.drawPlot = function (shape) {
        if (shape.indexOf("MARKER-icon") != -1) {
            var index = 14 + parseInt(shape.charAt(11));
            $scope.mapDemo.plot40l3.img = "images//left/icons/" + index + "-1.png";
        }
        $scope.mapDemo.plot40l3.type = shape;
    }
    $scope.changeMenu = function (index) {
        $scope.mapDemo.plot40l3.edit = index == 1;
    }
});
