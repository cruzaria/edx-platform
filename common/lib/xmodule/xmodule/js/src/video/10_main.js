(function (require, $) {
    'use strict';

    // In the case when the Video constructor will be called before RequireJS finishes loading all of the Video
    // dependencies, we will have a mock function that will collect all the elements that must be initialized as
    // Video elements.
    //
    // Once RequireJS will load all of the necessary dependencies, main code will invoke the mock function with
    // the second parameter set to truthy value. This will trigger the actual Video constructor on all elements
    // that are stored in a temporary list.
    window.Video = (function () {
        // Temporary storage place for elements that must be initialized as Video elements.
        var tempCallStack = [];

        return function (element, processTempCallStack) {
            // If mock function was called with second parameter set to truthy value, we invoke the real `window.Video`
            // on all the stored elements so far.
            if (processTempCallStack) {
                $.each(tempCallStack, function (index, element) {
                    // By now, `window.Video` is the real constructor.
                    window.Video(element);
                });

                return;
            }

            // If normal call to `window.Video` constructor, store the element for later initializing.
            tempCallStack.push(element);

            // Real Video constructor returns the `state` object. The mock function will return an empty object.
            return {};
        };
    }());

    // Main module.
    require(
        [
            'video/01_initialize.js',
            'video/025_focus_grabber.js',
            'video/035_video_accessible_menu.js',
            'video/04_video_control.js',
            'video/04_video_full_screen.js',
            'video/05_video_quality_control.js',
            'video/06_video_progress_slider.js',
            'video/07_video_volume_control.js',
            'video/08_video_speed_control.js',
            'video/09_video_caption.js',
            'video/09_play_placeholder.js',
            'video/09_play_pause_control.js',
            'video/09_play_skip_control.js',
            'video/09_skip_control.js',
            'video/09_bumper.js',
            'video/09_save_state_plugin.js',
            'video/09_events_plugin.js',
            'video/10_commands.js',
            'video/095_video_context_menu.js'
        ],
        function (
            initialize, FocusGrabber, VideoAccessibleMenu, VideoControl,
            VideoFullScreen, VideoQualityControl, VideoProgressSlider,
            VideoVolumeControl, VideoSpeedControl, VideoCaption,
            VideoPlayPlaceholder, VideoPlayPauseControl, VideoPlaySkipControl,
            VideoSkipControl, VideoBumper, VideoSaveStatePlugin,
            VideoEventsPlugin, VideoCommands, VideoContextMenu
        ) {
            var youtubeXhr = null,
                oldVideo = window.Video;

            window.Video = function (element) {
                var el = $(element).find('.video'), state;
                var getCleanState = function (state, metadata) {
                    return $.extend(true, {}, state, {metadata: metadata}, {
                        metadata: {
                            savedVideoPosition: 0,
                            speed: '1.0',
                            startTime: 0,
                            endTime: null,
                            streams: []
                        }
                    });
                };

                state = {
                    el: el,
                    metadata: el.data('metadata')
                };

                state.modules = [
                    FocusGrabber, VideoAccessibleMenu, VideoControl, VideoPlayPlaceholder,
                    VideoPlayPauseControl, VideoProgressSlider, VideoSpeedControl,
                    VideoVolumeControl, VideoQualityControl, VideoFullScreen,
                    VideoCaption, VideoCommands, VideoContextMenu, VideoSaveStatePlugin,
                    VideoEventsPlugin
                ];

                state.youtubeXhr = youtubeXhr;
                var bumperMetadata = el.data('bumper-metadata');

                if (!$.isEmptyObject(bumperMetadata)) {
                    var bumperState = getCleanState(state, bumperMetadata);

                    bumperState.modules = [
                        VideoAccessibleMenu, VideoControl, VideoPlayPlaceholder,
                        VideoPlaySkipControl, VideoSkipControl, VideoCaption,
                        VideoVolumeControl, VideoCommands
                    ];
                    bumperState.youtubeXhr = youtubeXhr;
                    bumperState.isBumper = true;
                    var bumper = new VideoBumper(initialize, bumperState, element);
                    bumper.getPromise().done(function () {
                        state.metadata.autoplay = true;
                        initialize(state, element);
                    });
                } else {
                    initialize(state, element);
                }

                if (!youtubeXhr) {
                    youtubeXhr = state.youtubeXhr;
                }

                el.data('video-player-state', state);

                var onSequenceChange = function onSequenceChange () {
                    if (state && state.videoPlayer) {
                        state.videoPlayer.destroy();
                    }
                    $('.sequence').off('sequence:change', onSequenceChange);
                };
                $('.sequence').on('sequence:change', onSequenceChange);

                // Because the 'state' object is only available inside this closure, we will also make it available to
                // the caller by returning it. This is necessary so that we can test Video with Jasmine.
                return state;
            };

            window.Video.clearYoutubeXhr = function () {
                youtubeXhr = null;
            };

            // Invoke the mock Video constructor so that the elements stored within it can be processed by the real
            // `window.Video` constructor.
            oldVideo(null, true);
        }
    );
}(window.RequireJS.require, window.jQuery));
