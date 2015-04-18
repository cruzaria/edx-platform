(function (requirejs, require, define) {

// VideoControl module.
define(
'video/04_video_control.js',
[],
function () {

    // VideoControl() function - what this module "exports".
    return function (state) {
        var dfd = $.Deferred();

        state.videoControl = {};

        _makeFunctionsPublic(state);
        _renderElements(state);
        _bindHandlers(state);

        dfd.resolve();
        return dfd.promise();
    };

    // ***************************************************************
    // Private functions start here.
    // ***************************************************************

    // function _makeFunctionsPublic(state)
    //
    //     Functions which will be accessible via 'state' object. When called, these functions will
    //     get the 'state' object as a context.
    function _makeFunctionsPublic(state) {
        var methodsDict = {
            destroy: destroy,
            hideControls: hideControls,
            show: show,
            showControls: showControls,
            updateVcrVidTime: updateVcrVidTime
        };

        state.bindTo(methodsDict, state.videoControl, state);
    }

    function destroy() {
        this.el.off({
            'mousemove': this.videoControl.showControls,
            'keydown': this.videoControl.showControls,
            'destroy': this.videoControl.destroy
        });
        this.el.off('controls');
        delete this.videoControl;
    }

    // function _renderElements(state)
    //
    //     Create any necessary DOM elements, attach them, and set their initial configuration. Also
    //     make the created DOM elements available via the 'state' object. Much easier to work this
    //     way - you don't have to do repeated jQuery element selects.
    function _renderElements(state) {
        state.videoControl.el = state.el.find('.video-controls');
        state.videoControl.vidTimeEl = state.videoControl.el.find('.vidtime');

        if ((state.videoType === 'html5') && (state.config.autohideHtml5)) {
            state.videoControl.fadeOutTimeout = state.config.fadeOutTimeout;

            state.videoControl.el.addClass('html5');
            state.controlHideTimeout = setTimeout(state.videoControl.hideControls, state.videoControl.fadeOutTimeout);
        }
    }

    // function _bindHandlers(state)
    //
    //     Bind any necessary function callbacks to DOM events (click, mousemove, etc.).
    function _bindHandlers(state) {
        if ((state.videoType === 'html5') && (state.config.autohideHtml5)) {
            state.el.on({
                'mousemove': state.videoControl.showControls,
                'keydown': state.videoControl.showControls
            });
        }

        state.el.on('destroy', state.videoControl.destroy);
    }

    // ***************************************************************
    // Public functions start here.
    // These are available via the 'state' object. Their context ('this' keyword) is the 'state' object.
    // The magic private function that makes them available and sets up their context is makeFunctionsPublic().
    // ***************************************************************

    function show() {
        this.videoControl.el.removeClass('is-hidden');
        this.el.trigger('controls:show', arguments);
    }

    function showControls(event) {
        if (!this.controlShowLock) {
            if (!this.captionsHidden) {
                return;
            }

            this.controlShowLock = true;

            if (this.controlState === 'invisible') {
                this.videoControl.el.show();
                this.controlState = 'visible';
            } else if (this.controlState === 'hiding') {
                this.videoControl.el.stop(true, false).css('opacity', 1).show();
                this.controlState = 'visible';
            } else if (this.controlState === 'visible') {
                clearTimeout(this.controlHideTimeout);
            }

            this.controlHideTimeout = setTimeout(this.videoControl.hideControls, this.videoControl.fadeOutTimeout);
            this.controlShowLock = false;
        }
    }

    function hideControls() {
        var _this = this;

        this.controlHideTimeout = null;

        if (!this.captionsHidden) {
            return;
        }

        this.controlState = 'hiding';
        this.videoControl.el.fadeOut(this.videoControl.fadeOutTimeout, function () {
            _this.controlState = 'invisible';
            // If the focus was on the video control or the volume control,
            // then we must make sure to close these dialogs. Otherwise, after
            // next autofocus, these dialogs will be open, but the focus will
            // not be on them.
            _this.videoVolumeControl.el.removeClass('open');
            _this.videoSpeedControl.el.removeClass('open');

            _this.focusGrabber.enableFocusGrabber();
        });
    }

    function updateVcrVidTime(params) {
        this.videoControl.vidTimeEl.html(Time.format(params.time) + ' / ' + Time.format(params.duration));
    }

});

}(RequireJS.requirejs, RequireJS.require, RequireJS.define));
