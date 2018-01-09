/**
 * Loading Directive
 * @see http://tobiasahlin.com/spinkit/
 */

angular
    .module('RDash')
    .directive('fileReader', fileReader);

function fileReader() {
    var directive = {};

    directive.scope = {
        fileReader: "=",
    };

    directive.link = function(scope, element) {
        $(element).on('change', function(changeEvent) {
            var files = changeEvent.target.files;
            console.log(files);
            if (files.length) {
              var r = new FileReader();
              r.onload = function(e) {
                  var contents = e.target.result;
                  scope.$apply(function () {
                    scope.fileReader = contents;
                  });
              };
              
              r.readAsText(files[0]);
            } else {
                scope.fileReader = "none";
            }
        });
    }

    return directive;
};