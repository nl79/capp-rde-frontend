
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

        var html = '<div class="page-header"><h4>'+ resp.data.question[0].QUESTION + '</h4></div>'
        //create the form element.
        html += '<form  class="form-horizontal text-" id="form-question-data" method="post" action="/survey/submitAnswer">';
        html += '<input id="q_id" type="hidden" name="q_id" value="' + question.ENTITY_ID + '"/>';
        html += '<input id="q_type" type="hidden" name="q_type" value="' + question.TYPE.trim() + '"/>';
        html += '<input id="a_type" type="hidden" name="a_type" value="' + question.DATA_TYPE + '"/>';


        /*
        html += '<div class="form-group"><br />' +
        '<h3 id="h3-question">' + resp.data.question[0].QUESTION + '</h3></div>';
        */
        var type = resp.data.question[0].TYPE.trim();

        if(type == 'radio' || type=='checkbox') {

            if (options && options.length && options.length > 0) {

                /*
                 if answer is not empty, create an array of values to check against.
                 */
                if(answer && answer.length && answer.length == 1) {
                    var list = answer[0].VALUE.trim().split('|');
                }

                /*loop and build the options list.
                 the values property of the input field must replace all comma ',' characters
                 with a '~' because coldfusion uses ',' as a list separator. Therefore
                 leaving the comma in place would split an option into pieces.
                 */
                for (var i = 0; i < options.length; i++) {

                    var value = options[i].VALUE.trim()

                    html += "<div class='" + type + "'>";
                    html += "<label><input id='o_id-" + options[i].ENTITY_ID +
                    "' type='" + type.trim() +
                    "' name='answer'" +
                    "' value='" + options[i].VALUE.trim().replace(',','~') + "'";

                    /* check if the value exists in the options list. */
                    if(list && list.indexOf(value) != -1) {
                        html += " checked ";
                    }

                    html += "/>" + value + "</label></div><br />";

                }
            }
        } else if (type=='text') {

            /*check if answer is set for the current question and
             set the data inside the id field and the value.
             */
            html += "<textarea class='text' name='answer'>";
            if(answer && answer.length && answer.length > 0) {

                html += answer[0].VALUE;
            }

            html += "</textarea><br />";
        }

        /*
        html +='<p class="text-center">';
        html += "<button class='btn btn-info' onclick='getQuestion(this)' " +
        "id='button-previous' type='button' name='submit' value='previous'>Prev</button>";


         html += "<button onclick='submitAnswer(this)' " +
         "id='button-submit' type='button' name='submit' value='submit'>Submit</button>";


        html += "<button class='btn btn-info' onclick='getQuestion(this)' " +
        "id='button-next' type='button' name='submit' value='next'>Next</button>";


        html += "<br />" +
        "<button class='btn btn-info' onclick='getQuestion(this)' id='button-skip' " +
        "type='button' name='submit' value='skip'>Skip</button>";
        html += '</p>';
        */

        html += '</form>';

        document.getElementById('div-content').innerHTML = html;
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
                    error(data);
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

            if(data && data.statusCode) {

                switch(parseInt(data.statusCode)){
                    case 200:

                        break;

                    case 400:
                        error(data);
                        break;
                }
            }
        }
    }

    $.ajax(settings).done(callback);

}

function submitAnswer(ele){


    /* if the data is not valid return false */
    if(!isValid()) { return false; }

    //serialize the form.
    var data = $('form#form-question-data').serialize();

    /* get the hidden ip field
     * or load it from the temp storage
     */
    var ip = window.sessionStorage.ip || $('input#input-ip').val();

    var url = 'http://' + ip + '/survey/save';

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
                    message(data);
                    break;

                case 204:
                    finished(data);
                    break;

                case 400:
                    error(data);
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

            alert('Please Select an Answer, or Click Skip to skip the question');

            return false;
        }

    } else if(q_type == 'text') {
        /* if the answer is a text type, validate that the value of the
         textarea is not empty.
         */
        if($(answers[0]).val() == "") {

            alert('Please Enter an Answer or Select Skip to skip the question');

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
                        alert('Value Must be a valid date.');

                        return false;
                    }

                    break;

                case 'currency':

                    /* check that the value is a valid number */
                    if(isNaN(value)) {

                        alert('Value Must be a valid currency amount.');

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

                        alert('Value Must be a valid Integer.');

                        return false;
                    }
                    break;

                case 'float':
                    if(isNaN(value)) {

                        alert('Value Must be a valid Number.');

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
            console.log(data)
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

                    message(data.message);
                    break;

            }
        }
    }

    $.ajax(settings).done(callback);
}

function finished() {
    alert('survey finished');
}

function message(msg) {

    $('p#p-message').text(msg);
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
                    //window.location = 'index.html';

                    break;
                case 200:
                    renderQuestion(data);

                    /*set the buttons to visible */
                    $('div#p-form-buttons').show();
                    break;
            }
        }
    }

    $.ajax(settings).done(callback);
}

function error(data) {

}
