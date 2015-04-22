$(document).ready(function () {

    /*get a reference to the window object. */
    var _window = $(window);

    /*set the content wrapper height to the screen height */
    /* set the content wrapper height */
    $('div#div-content-wrapper').height(_window.height());
    $('div#div-panel-md4-body').height(_window.height() - 130);

    //stick in the fixed 100% height behind the navbar but don't wrap it
    $('#slide-nav.navbar-inverse').after($('<div class="inverse" id="navbar-height-col"></div>'));
  
    $('#slide-nav.navbar-default').after($('<div id="navbar-height-col"></div>'));  

    // Enter your ids or classes
    var toggler = '.navbar-toggle';
    var pagewrapper = '#page-content';
    var navigationwrapper = '.navbar-header';
    var menuwidth = '100%'; // the menu inside the slide menu itself
    var slidewidth = '80%';
    var menuneg = '-100%';
    var slideneg = '-80%';


    $("#slide-nav").on("click", toggler, function (e) {

        var selected = $(this).hasClass('slide-active');

        $('#slidemenu').stop().animate({
            left: selected ? menuneg : '0px'
        });

        $('#navbar-height-col').stop().animate({
            left: selected ? slideneg : '0px'
        });

        $(pagewrapper).stop().animate({
            left: selected ? '0px' : slidewidth
        });

        $(navigationwrapper).stop().animate({
            left: selected ? '0px' : slidewidth
        });


        $(this).toggleClass('slide-active', !selected);
        $('#slidemenu').toggleClass('slide-active');


        $('#page-content, .navbar, body, .navbar-header').toggleClass('slide-active');


    });


    var selected = '#slidemenu, #page-content, body, .navbar, .navbar-header';


    _window.on("resize", function () {


        if (_window.width() > 867 && $('.navbar-toggle').is(':hidden')) {
            $(selected).removeClass('slide-active');
        }
        /* set the content wrapper height */
        $('div#div-content-wrapper').height(_window.height());

    });



    /* add on swipe left hander to check if the
     side bar menu is open, if so close it.
     */
    _window.on('swipeleft', function() {

        /*check if the body has 'slide-active' element
         if so close the menu
         */
        if($("body").hasClass('slide-active')) {
            /* close the slide menu */

            //$( "#slide-nav" ).trigger( "click" );
            $( "a#a-navbar-toggle" )[0].click();
        }
    })

    /* add on swipe right handler to check if the sidebar menu is
     close, if so open it.
     */
    _window.on('swiperight', function() {

        /*check if the navbar-height-col does not exist, open it */
        if(!$("body").hasClass('slide-active')) {
            /* open the slide menu */

            //$( "#slide-nav" ).trigger( "click" );
            $( "a#a-navbar-toggle" )[0].click();
        }
    })

});

$(document).ready(function() {


    $('.input-group input[required], .input-group textarea[required], .input-group select[required]').on('keyup change', function() {
        var $form = $(this).closest('form'),
            $group = $(this).closest('.input-group'),
            $addon = $group.find('.input-group-addon'),
            $icon = $addon.find('span'),
            state = false;
            
        if (!$group.data('validate')) {
            state = $(this).val() ? true : false;
        }else if ($group.data('validate') == "email") {
            state = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test($(this).val())
        }else if($group.data('validate') == 'phone') {
            state = /^[(]{0,1}[0-9]{3}[)]{0,1}[-\s\.]{0,1}[0-9]{3}[-\s\.]{0,1}[0-9]{4}$/.test($(this).val())
        }else if ($group.data('validate') == "length") {
            state = $(this).val().length >= $group.data('length') ? true : false;
        }else if ($group.data('validate') == "number") {
            state = !isNaN(parseFloat($(this).val())) && isFinite($(this).val());
        }

        if (state) {
                $addon.removeClass('danger');
                $addon.addClass('success');
                $icon.attr('class', 'glyphicon glyphicon-ok');
        }else{
                $addon.removeClass('success');
                $addon.addClass('danger');
                $icon.attr('class', 'glyphicon glyphicon-remove');
        }
        
        if ($form.find('.input-group-addon.danger').length == 0) {
            $form.find('[type="submit"]').prop('disabled', false);
        }else{
            $form.find('[type="submit"]').prop('disabled', true);
        }
    });
    
    $('.input-group input[required], .input-group textarea[required], .input-group select[required]').trigger('change');
    
    
});

//$('#sandbox-container .input-group.date').datepicker({ });