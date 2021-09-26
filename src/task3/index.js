angular.module('app', [])
    .controller('MagneticBlocks', function($scope) {
        $scope.addNewSquare = 0;
        $scope.stop = false;

        $scope.addSquare = function(e){
            if(e.target.id === 'canvas'){
                $scope.addNewSquare++;
            }
        }

        $scope.stopMoving = function(e){
            $scope.stop = !$scope.stop;
        }

    });