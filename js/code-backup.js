
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
