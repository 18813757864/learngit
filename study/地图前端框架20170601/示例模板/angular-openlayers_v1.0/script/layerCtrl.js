app.controller("layerCtrl", function ($scope, olHelpers) {
    $scope.$on('$destroy', function () {
        //清空地图上的图层
        $scope.mapDemo.regions.visible = false;
        $scope.mapDemo.regions.labels = [];
    });
    var getFeatureInterior = function (feature) {
        var innerCoord;
        if (feature.getGeometry() instanceof ol.geom.Polygon) {
            innerCoord = feature.getGeometry().getInteriorPoint().getCoordinates();
        } else if (feature.getGeometry() instanceof ol.geom.MultiPolygon) {
            var polygons = feature.getGeometry().getPolygons();
            var len = polygons.length;
            var areas = [],
                maxId = 0;
            polygons.forEach(function (item) {
                areas.push(item.getArea());
            });
            for (var i = 0; i < len; i++) {
                if (areas[i] > areas[maxId]) {
                    maxId = i;
                }
            }
            innerCoord = polygons[maxId].getInteriorPoint().getCoordinates();
        }
        return innerCoord;
    }
    var createOverlay = function (feature) {
        var innerCoord = getFeatureInterior(feature);
        var label = {
            coord: innerCoord,
            label: {
                classNm: 'featureLabel',
                message: "<div style='white-space: nowrap;'>" + feature.get("MC") + "</div>",
                stopEvent: false
            }
        };
        $scope.mapDemo.regions.labels.push(label);
        feature.set("overLay", label);
        $scope.$apply();
    }
    $scope.mapDemo.regions.regionLoaded = function (oSource) {
        if (!oSource) {
            return;
        }
        var featureArr = oSource.getFeatures();
        if (featureArr.length > 0) {
            var total = featureArr.length;
            $scope.mapDemo.regions.labels = [];
            for (var j = 0; j < total; j++) {
                createOverlay(featureArr[j]);
            }
            var coords = featureArr[parseInt(total / 2)].getGeometry().getInteriorPoint().getCoordinates();
            $scope.olMap.center.lat = coords[1];
            $scope.olMap.center.lon = coords[0];
            $scope.olMap.center.zoom = 10;
            $scope.$apply();
        }
    }
    $scope.mapDemo.regions.visible = true;
});
