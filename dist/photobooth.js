'use strict';
angular.module('ng-photobooth', [])
  .provider('photobooth', function() {
    var postUrl,
        pattern = /^data:image\/(png|gif|jpe?g);base64,(.*)$/;

    this.setPostUrl = function(url) {
      postUrl = url;
    };

    this.$get = ['$http', function($http) {
      return {
        saveDataUrl: function(dataUrl) {
          var matches = dataUrl.match(pattern);
          if (! matches) {
            throw new Error('Cannot save non-image data');
          }
          return $http.post(postUrl, {image: matches[2], ext: matches[1]});
        }
      };
    }];
  });

'use strict';
angular.module('ng-photobooth')
  .directive('photoButton', function() {
    var defaultClass = 'is-active';

    return function(scope, elem, attrs) {
      /**
       * Either signal the camera to start or capture based on the state of the button
       */
      elem.bind('click', function() {
        scope.$emit((scope.camera) ? 'photobooth:capture' : 'photobooth:start', scope.camera);
      });

      /**
       * Change the state of the photo button when the camera starts
       */
      scope.$on('photobooth:cameraStart', function(e, camera) {
        scope.camera = camera;
        elem.addClass(attrs.startClass || defaultClass);
      });

      /**
       * Remove the video element and active button class
       */
      scope.$on('photobooth:cameraStop', function() {
        delete scope.camera;
        elem.removeClass(attrs.startClass || defaultClass);
      });
    };
  });

'use strict';
angular.module('ng-photobooth')
  .directive('photoPreview', ['webcam', function(webcam) {
    return function(scope, elem, attrs) {
      function onCameraStart() {
        elem.addClass(attrs.cameraOnClass || 'is-active');
        scope.$emit('photobooth:cameraStart', elem.find('video')[0]);
      }

      function onCameraError(code) {
        scope.$emit('photobooth:cameraError', code);
      }

      scope.$on('photobooth:start', function() {
        elem.html('<video autoplay></video>' +
                  '<canvas></canvas>');
        webcam.start(elem.find('video')[0], onCameraStart, onCameraError);
      });

      scope.$on('photobooth:capture', function() {
        webcam.capture(
          elem.find('video')[0],
          elem.find('canvas')[0],
          attrs.previewType || 'image/png'
        );
      });
    };
  }]);

'use strict';
angular.module('ng-photobooth')
  .service('webcam', ['photobooth', function(photobooth) {
    return  {
      start: function(video, successFn, errorFn) {
        navigator.getUserMedia(
          {
            video: true,
            audio: false
          },
 
          function(stream) {
            video.src = window.URL.createObjectURL(stream);
            successFn(stream);
          },

          errorFn
        );
      },
      capture: function(video, canvas, type) {
        canvas.width = video.width;
        canvas.height = video.height;
        canvas.getContext('2d').drawImage(video, 0, 0);
        return photobooth.saveDataUrl(canvas.toDataURL(type));
      }
    };
  }])
  .run(function() {
    navigator.getUserMedia = navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia ||
                             navigator.msGetUserMedia;
  });
