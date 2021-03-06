/*
Polyfill  methods
 */
Number.isInteger = Number.isInteger || function(value) {
    return typeof value === "number" &&
        isFinite(value) &&
        Math.floor(value) === value;
};

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

/********************************************************************************/



function renderQuestion(resp) {

    if(resp.statusCode == 200) {

        //extract all of the parts.
        var question = resp.data.question[0];
        var options = resp.data.options;
        var answer = resp.data.answer;

        //array of answer values.
        var answers = [];

        var html = '<div id="div-question-container" class="panel-heading "><h4 id="h4-question">'+ resp.data.question[0].QUESTION + '</h4></div><hr />'
        //create the form element.
        html += '<form  class="form-horizontal text-" id="form-question-data" method="post" action="/survey/submitAnswer">';
        html += '<input id="q_id" type="hidden" name="q_id" value="' + question.ENTITY_ID + '"/>';
        html += '<input id="q_type" type="hidden" name="q_type" value="' + question.TYPE.trim() + '"/>';
        html += '<input id="a_type" type="hidden" name="a_type" value="' + question.DATA_TYPE.trim() + '"/>';


        /*
        html += '<div class="form-group"><br />' +
        '<h3 id="h3-question">' + resp.data.question[0].QUESTION + '</h3></div>';
        */
        var type = resp.data.question[0].TYPE.trim().toLowerCase();

        switch(type) {

            case 'radio':
            case 'checkbox':
                if (options && options.length && options.length > 0) {

                    /*
                     if answer is not empty, create an array of values to check against.
                     */
                    if(answer && answer.length && answer.length == 1) {
                        var list = answer[0].VALUE.toString().trim().split('|');
                    }

                    /*loop and build the options list.
                     the values property of the input field must replace all comma ',' characters
                     with a '~' because coldfusion uses ',' as a list separator. Therefore
                     leaving the comma in place would split an option into pieces.
                     */

                    for (var i = 0; i < options.length; i++) {


                        var value = options[i].VALUE.toString().trim();

                        html += "<div class='" + type + "'>";
                        html += "<label><input id='o_id-" + options[i].ENTITY_ID +
                        "' type='" + type.trim() +
                        "' name='answer'" +
                        "' value='" + options[i].VALUE.toString().trim().replace(',','~') + "'";

                        /* check if the value exists in the options list. */
                        if(list && list.indexOf(value) != -1) {
                            html += " checked ";
                        }

                        html += "/>&nbsp" + value + "</label></div><br />";

                    }
                }

                break;

            case 'date':
            case 'text':

                html += "<div class='" + type + "'>";
                html += "<input id=''" +
                "' type='" + type.trim() +
                "' name='answer'" +
                "' value='";

                if(answer && answer.length && answer.length > 0) {

                    html += answer[0].VALUE;
                }

                html += "' /></div><br />";

                break;

            case 'bigtext':

                /*check if answer is set for the current question and
                 set the data inside the id field and the value.
                 */
                html += "<textarea class='text' name='answer'>";
                if(answer && answer.length && answer.length > 0) {

                    html += answer[0].VALUE;
                }

                html += "</textarea><br />";
                break;

        }



        html += '</form>';

        document.getElementById('div-content').innerHTML = html;

        //$('form#form-question-data').height($(window).height() - 390);
    }

}

function getQuestion(e) {

    /* extract the value of the clicked button element */
    var action = e.getAttribute('value');

    /* if the action is next save the current question */
    if(action == 'next') {

        if(!submitAnswer()) { return; }
    }

    if(action =='skip') {
        var q = confirm("Are you Sure you want to skip?");

        if(!q) { return; }

        skipQuestion();
        //change the action to 'next' to load the next question
        action = 'next';
    }

    /* get the current question_id */
    var q_id = $("input#q_id").val();

    /* get the hidden ip field
     * or load it from the temp storage
     */
    var ip = window.sessionStorage.ip || $('input#input-ip').val();

    var url = 'http://' + ip + '/survey/load' + action;

    var settings = {
        url: url,
        type: 'POST',
        data: 'q_id=' + q_id,
        dataType: 'json',
        xhrFields: {withCredentials: true}
    };

    var callback = function(data) {

        if(data && data.statusCode) {
            switch(parseInt(data.statusCode)){
                case 200:

                    renderQuestion(data);

                    break;

                case 204:

                    finished(data);

                    break;

                case 302:
                    /* redirect */
                    var url = data.url.trim();

                    window.location = url + '.html';
                    break;

                case 400:
                case 404:
                    message(data[data.type], data.type);
                    break;
            }
        }
    }

    $.ajax(settings).done(callback);
}

function skipQuestion(e) {
    var q_id = $('input#q_id').val();

    /* get the hidden ip field
     * or load it from the temp storage
     */
    var ip = window.sessionStorage.ip || $('input#input-ip').val();

    var url = 'http://' + ip + '/survey/skip';

    var settings = {
        url: url,
        type: 'POST',
        data: 'q_id=' + q_id,
        dataType: 'json',
        xhrFields: {withCredentials: true}
    };

    var callback = function(data) {

        if(data && data.statusCode) {

            switch(parseInt(data.statusCode)){

                case 200:

                    message("Question Skipped", 'info');

                    updateProgress(q_id);

                    break;

                case 400:

                    message(data.message, 'error');

                    break;
            }
        }
    }

    $.ajax(settings).done(callback);

}

function submitAnswer(ele){


    /* if the data is not valid return false */
    if(!isValid()) {

        return false; }


    //serialize the form.
    var data = $('form#form-question-data').serialize();

    /* get the hidden ip field
     * or load it from the temp storage
     */
    var ip = window.sessionStorage.ip || $('input#input-ip').val();

    var url = 'http://' + ip + '/survey/save';

    var q_id = $('input#q_id').val();

    var settings = {
        url: url,
        type: 'POST',
        data: data,
        dataType: 'json',
        xhrFields: {withCredentials: true}
    };

    var callback = function(data) {

        if(data && data.statusCode) {
            switch(parseInt(data.statusCode)){
                case 200:

                    message(data[data.type], data.type);

                    updateProgress(q_id);

                    break;

                case 204:

                    message(data[data.type], data.type);

                    break;

                case 400:
                    message(data[data.type], data.type);

                    break;

                default:
                    console.log(data);
                    break;
            }

        }
    }

    $.ajax(settings).done(callback);

    return true;
}

function isValid() {

    var valid = true;

    /* get the question type */
    var q_type = $('input#q_type').val();

    /*get the answer values */
    var answers = $("[name='answer']");

    /*based on q_type check if an answer has been selected. */
    if(q_type == 'radio' || q_type == 'checkbox') {

        /* if the question type is a radio or checkbox
         loop over all of the answer objects and make sure at least
         one item is checked.
         */
        var checked = false;

        var callback = function(index) {
            if($(this).is(':checked')) {
                checked = true;
            }
        }
        answers.each(callback);

        /* if the checked flag is false, no answers has been supplied,
         return false;
         */
        if(checked == false) {

            //alert('Please Select an Answer, or Click Skip to skip the question');
            message('Please Select an Answer, or Click Skip to skip the question', 'error');
            return false;
        }

    } else if(q_type == 'text' || q_type == 'bigtext') {
        /* if the answer is a text type, validate that the value of the
         textarea is not empty.
         */
        if($(answers[0]).val() == "") {

            message('Please Enter an Answer or Select Skip to skip the question', 'error');

            return false;

        } else {
            /* get the answer type and validate the answer */
            var a_type = $('input#a_type').val();

            /* get the value */
            var value = $(answers[0]).val();

            /* validate that the answer is the correct data type */
            switch (a_type.trim().toLowerCase()) {
                case 'date':

                    /* try to convert the data into a unit timestamp */
                    if(isNaN(Date.parse(value))){
                        message('Value Must be a valid date.', 'error');

                        return false;
                    }

                    break;

                case 'currency':

                    /* check that the value is a valid number */
                    if(isNaN(value)) {

                        message('Value Must be a valid currency amount.','error');

                        return false;
                    } else {

                        /* if the value is a valid number, format the answer
                         and set it back into the field for when its serialized
                         */

                        $(answers[0]).val(Math.round(value * 100) / 100);
                    }

                    break;
                case 'int':

                    if(isNaN(value) || value % 1 != 0) {

                        message('Value Must be a valid Integer.','error');

                        return false;
                    }
                    break;

                case 'float':
                    if(isNaN(value)) {

                        message('Value Must be a valid Number.', 'error');

                        return false;
                    }
                    break
            }
        }
    }

    return true;
}

function logout() {
    var q = confirm("Confirm Logout");

    if(q) {
        /* ajax call to the logout action */

        var ip = window.sessionStorage.ip || $('input#input-ip').val();
        var url = 'http://' + ip + '/account/logout';

        var settings = {
            url: url,
            type: 'POST',
            data: '',
            dataType: 'json',
            xhrFields: {withCredentials: true}
        };

        var callback = function(data, status, xhr) {

            if(data && data.statusCode) {

                switch(parseInt(data.statusCode)){

                    case 302:

                        window.location = data.url.trim() + '.html';

                        break;

                    default:
                }
            }
        }

        $.ajax(settings).done(callback);
    }
}

function config() {
	/* prompt the user for the ip address */ 
	var ip = prompt("Enter Server's IP Address(xxx.xxx.xxxx.xxxx)");

    $('input#input-ip').val(ip);

    window.sessionStorage.ip = ip;

}

function accountLogin() {
	/* get the hidden ip field */
    var ip = $('input#input-ip').val();
    var url = 'http://' + ip + '/account/login';
    var data = $('form#form-login').serialize();

    var settings = {
        url: url,
        type: 'POST',
        data: data,
        dataType: 'json',
        xhrFields: {withCredentials: true}
    };

    var callback = function(data, status, xhr) {

        if(data && data.statusCode) {

            switch(parseInt(data.statusCode)){

                case 302:

                    /* get the session id and set it as cookie */
                    var JSESSIONID = data.JSESSIONID;

                    if(JSESSIONID) {
                        $.cookie('JSESSIONID', JSESSIONID, { path: '/' })
                    }

                    window.sessionStorage.JSESSIONID = JSESSIONID;

                    /* redirect */
                    var url = data.url.trim();

                    window.location = url + '.html';

                    break;

                default:

                    //alert('login failed');
                    $('p#p-message').text(data.message);

                    break;

            }
        }
    }

    $.ajax(settings).done(callback);
}

function finished() {

    /* show a modal notifying that the survey has been finished and
    offer to redirect to the maps page.
     */

    $("#myModal").modal('show');
}


function startSurvey(e) {

    /* get the hidden ip field
     * or load it from the temp storage
     */
    var ip = window.sessionStorage.ip || $('input#input-ip').val();

    var url = 'http://' + ip + '/survey/start';

    var settings = {
        url: url,
        type: 'POST',
        data: '',
        dataType: 'json',
        xhrFields: {withCredentials: true}
    };

    var callback = function(data) {

        if(data && data.statusCode) {

            switch(parseInt(data.statusCode)){

                case 401:

                    /* redirect to login */
                    window.location = 'index.html';

                    break;
                case 200:

                    /* extract the keys and build a progress bar */
                    renderProgressBar(data.data);

                    renderQuestion(data);

                    /*set the buttons to visible */
                    $('div#p-form-buttons').show();

                    break;
            }
        }
    }

    $.ajax(settings).done(callback);
}

function renderProgressBar(data) {

    if(!data) { return };

    /*extract the question data in order to get the current id*/
    var q_id = data.question[0].ENTITY_ID;

    /*get the location of the current id from the keys array
     * store the keys array globally so that methods are able to
      * update the progress bar as the questions are saved.
     */

    var keys = data.keys;

    window.survey = {keys: keys};

    /* calcuate the percent complete by comparing the current versus the total count */
    var currentIndex = keys.indexOf(q_id);

    var percent = Math.ceil((currentIndex/keys.length) * 100);

    /* update the progress bar with the percent complete */
    $('div#div-progress').text(percent + "%").width(percent + '%');
}

function updateProgress(id) {

    /* if the id was not supplied, retrieve it from the hidden form field*/
    var q_id = id;


    if(!q_id || isNaN(q_id) || !window.survey.keys) {
        message('Failed to Update Progress. Invalid Key Supplied', 'error');
        return;
    }

    /* get the keys array from the window object. */
    var keys = window.survey.keys;

    /*get the index of the currently saved question */
    var index = keys.indexOf(parseInt(q_id)) + 1;

    /*calcuate the percentage of completed questions */
    var percent = Math.ceil((index/keys.length) * 100);

    console.log(percent);

    /*update the progress bar*/
    $('div#div-progress').text(percent + "%").width(percent + '%');
}


/*
function alert(selector, delay) {
    var alert = $(selector).alert();
    window.setTimeout(function() { alert.alert('close') }, delay);
}
*/

function message(msg, type, timeout) {

    var timeout = timeout || 2000;

    var style = "alert-";

    /* build the message class value by type */
    switch (type.toLowerCase()) {
        case 'error':
        case 'danger':
            style += 'danger'
            break;
        case 'success':
            style += 'success'
            break;

        case 'warning':
            style += 'warning'
            break;

        case 'info':
            style += 'info'
            break;
    }

    /*ge ta refrence to the parent container */
    var msgContainer = $('div#message');

    /*get the child div element that will wrap the message text and set the msg*/
    msgContainer.find('div#div-alert-text').addClass(style).text(msg);
    msgContainer.slideDown();

    setTimeout(function() {
        msgContainer.fadeOut(480, function () {
            msgContainer.find('div#div-alert-text').removeClass(style);
        });
       // msgContainer.find('div#div-alert-text').removeClass(style);
    }, timeout);
}

function getGoogleMap(){

    $.mobile.loading( "show", {
        text: "Loading Map",
        textVisible: true,
        theme: "a",
        html: ""
    });

    console.log('here');

    var url = "https://www.google.com/maps/search/nearby+hospitals";

    navigator.geolocation.getCurrentPosition(function(pos) {

        alert(pos);
        var lat = pos.coords.latitude;
        var lon = pos.coords.longitude;

        url += "/@" + lat + "," + lon +'z';

        //alert(lat + '\n' + lon + '\n' + url);
        //window.open(data, '_system');

    }, function(err) {
        var a = confirm('Error Retrieving Position. \n Please Make sure your locations is enabled.\n ' +
        'A general list of locations will be displayed if you proceed.');

        if(a == false) {
            return;
        }
    });

    window.location = url;
}

