$(document).ready(function() {
	initializeLocalStorage();
	storage_symbols = JSON.parse(localStorage.getItem("storage_symbols_obj"));
	storage_score = JSON.parse(localStorage.getItem("storage_score_obj"));
	checked_storage_symbols = {"symbols": []};
	correct_answer_index = 0;
	flashcard_type = 1;
	temp_correct_state = 1; // used in onAnswerBoxClick()

	initializeSound();
	setFlashcard();
});





// initialize soundmanager2
function initializeSound() {
	soundManager.setup({
		url: "javascript_libs/soundmanager2/",
		flashVersion: 9,
		useFlashBlock: false
	});
}





// prepare flashcard
function setFlashcard() {
	// single out chosen practice symbols
	for (var i=0; i<storage_symbols.symbols.length; i++)
		if (storage_symbols.symbols[i].se == 1)
			checked_storage_symbols.symbols.push(storage_symbols.symbols[i]);

	//console.log(storage_symbols.symbols[188]);
	//console.log(storage_symbols.symbols[44]);

	randomizeFlashcardType();

	// choose new flashcard
	correct_answer_index = Math.floor(Math.random() * checked_storage_symbols.symbols.length);
	if (flashcard_type == 1)
		var current_flashcard = checked_storage_symbols.symbols[correct_answer_index].sy;
	else if (flashcard_type == 2)
		var current_flashcard = checked_storage_symbols.symbols[correct_answer_index].ro;
 	else if (flashcard_type == 3) {
		var sound_path = "sounds/" + String(checked_storage_symbols.symbols[correct_answer_index].ro) + ".mp3";
		sound_path = sound_path.replace("*", "");
		sound_path = sound_path.replace("o/", "");

		soundManager.onready(function() {
			soundManager.createSound({
				id: "current_sound",
				url: sound_path
			});
			soundManager.play("current_sound");
		});

 		var current_flashcard = "" +
			"<img src='images/play.png' " +
			"	id='play_image' alt='play' " +
			"	onClick='soundManager.play(\"current_sound\");' />";
	}


	console.log(checked_storage_symbols.symbols[correct_answer_index]);
	// output flashcard
	$("#flashcard_content").empty();
	$("#flashcard_content").append(current_flashcard);


	initializeAnswers();
}





// prepare answer boxes
function initializeAnswers() {
	var storage_symbols_range = storage_symbols.symbols.length;
	var answer_boxes = "";
	var answers = [], answers_ro = [], answers_sy = [];
	var i=0, j=0, temp_index=0, skip_flag;

	// used in onAnswerBoxClick()
	// 1 => not answered yet
	// 0 => answered wrongly
	// 2 => answered correctly
	temp_correct_state = 1;


	// prepare the correct answer
	var random_index = Math.floor(Math.random() * $.cookie("difficulty"));

	if (flashcard_type == 1)
		answers[random_index] = checked_storage_symbols.symbols[correct_answer_index].ro;
	else if ((flashcard_type == 2) || (flashcard_type == 3))
		answers[random_index] = checked_storage_symbols.symbols[correct_answer_index].sy;


	// prepare wrong answers
	while (i<$.cookie("difficulty")) {
		skip_flag = 0;

		// prepare incorrect answers if answers[i] is not the correct answer
		if (i != random_index) {
			current_symbol_index = Math.floor(Math.random() * storage_symbols_range);

			answers_ro[i] = storage_symbols.symbols[current_symbol_index].ro;
			answers_sy[i] = storage_symbols.symbols[current_symbol_index].sy;

			if (flashcard_type == 1)
				answers[i] = answers_ro[i];
			else if ((flashcard_type == 2) || (flashcard_type == 3))
				answers[i] = answers_sy[i];


			// skip duplicate answers (duplicate answers with lower index than the index of the correct answers)
			if (String(answers[i]) == String(answers[random_index]))
				skip_flag = 1;


			// skip duplicate answers (same incorrect answer appearing twice)
			for (j=0; j<i; j++)
				if (String(answers[i]) == String(answers[j]))
					skip_flag = 1;


			// skip same roumaji written in different kana type (hiragana/katakana)
			if ((flashcard_type == 2) || (flashcard_type == 3))
				for (j=0; j<i; j++)
					if (String(answers_ro[i]) == String(answers_ro[j]))
						skip_flag = 1;


			// skip empty symbol values
			if (answers[i] == "")
				skip_flag = 1;


			// if flashcard answer is unique, set next flashcard
			if (skip_flag != 1)
				i++;
		}
		else
			i++;
	}


	// prepare correct and answer count information
	var correct_answers_count = storage_score.correct;
	var total_answers_count = storage_score.total;
	if (total_answers_count != 0)
		var success_rate_percentage = "(" + (correct_answers_count / total_answers_count * 100).toPrecision(4) + "%)";
	else
		var success_rate_percentage = "";


	// generate answers table and add success rate information to it
	var success_rate = "Success rate: " + correct_answers_count + "/" + total_answers_count + " " + success_rate_percentage;
	answer_boxes += "<table>" +
		"<tr>" +
		"	<td id='score' class='answers_table_header' colspan='3'>" + success_rate + "</td>" +
		"	<td class='answers_table_header'><a href='practice.php'>skip</a></td>" +
		"</tr>";


	for (i=0; i<($.cookie("difficulty") / 4); i++) {
		answer_boxes += "<tr>";
		for (j=0; j<4; j++) {
			// set temporary answer
			if (flashcard_type == 1)
				tmp_answer = checked_storage_symbols.symbols[correct_answer_index].ro;
			else if ((flashcard_type == 2) || (flashcard_type == 3))
				tmp_answer = checked_storage_symbols.symbols[correct_answer_index].sy;

			if (String(answers[temp_index]) == tmp_answer)
				var answer_id = "correct_answer";
			else
				var answer_id = "answer_box_" + temp_index;

			answer_boxes += "" +
				"<td id='" + answer_id + "' onclick='onAnswerBoxClick(\"" + answer_id + "\");'>" +
				"" + answers[temp_index] +
				"</td>";
			temp_index++;
		}
		answer_boxes += "</tr>";
	}
	answer_boxes += "</table>";


	generateSuccessRatesTable();


	// output flashcard answers
	$("#flashcard_table").empty();
	$("#flashcard_table").append(answer_boxes);
}





// actions to execute on answering
function onAnswerBoxClick(answer_id) {
	// on answering correctly change box color and increse count
	if (answer_id == "correct_answer") {
		$("#" + answer_id).css('background-color', "#207947");

		// if the correct answer was the first choice increment both correct and total count
		if (temp_correct_state == 1) {
			for (var i=0; i<storage_symbols.symbols.length; i++) {
				if (storage_symbols.symbols[i].sy == checked_storage_symbols.symbols[correct_answer_index].sy) {
					if (flashcard_type == 1) {
						storage_symbols.symbols[i].ck++;
						storage_symbols.symbols[i].tk++;
					}
					else if (flashcard_type == 2) {
						storage_symbols.symbols[i].cr++;
						storage_symbols.symbols[i].tr++;
					}
					else if (flashcard_type == 3) {
						storage_symbols.symbols[i].cv++;
						storage_symbols.symbols[i].tv++;
					}

					storage_score.correct++;
					storage_score.total++;

					temp_correct_state = 2;
				}
			}
		}
		// if the correct answer was not the first answer, go to next flashcard
		else
			temp_correct_state = 2;
	}
	// on answering incorrectly change box color and increse total count
	else {
		$("#" + answer_id).css('background-color', "#c32918");

		// increse total count only if answered wrongly on first try
		if (temp_correct_state == 1) {
			for (var i=0; i<storage_symbols.symbols.length; i++) {
				if (storage_symbols.symbols[i].sy == checked_storage_symbols.symbols[correct_answer_index].sy)
					if (flashcard_type == 1)
						storage_symbols.symbols[i].tk++;
					else if (flashcard_type == 2)
						storage_symbols.symbols[i].tr++;
					else if (flashcard_type == 3)
						storage_symbols.symbols[i].tv++;

			}

			storage_score.total++;
		}

		temp_correct_state = 0;
	}


	// save changes to storage_symbols_obj
	localStorage.setItem("storage_symbols_obj", JSON.stringify(storage_symbols));
	localStorage.setItem("storage_score_obj", JSON.stringify(storage_score));


	// if answered correctly, set next flashcard
	if (temp_correct_state == 2) {
		soundManager.destroySound("current_sound");
		setTimeout(function() { setFlashcard() }, 1000);
	}
}





// randomize flashcard type for each flashcard
function randomizeFlashcardType() {
	var combination_sum = 0;

	if ($.cookie("flashcard_type_ktr") == 1)
		combination_sum += 1;
	if ($.cookie("flashcard_type_rtk") == 1)
		combination_sum += 2;
	if ($.cookie("flashcard_type_vtk") == 1)
		combination_sum += 4;


	// if user unchecked all kana types, set flashcard_type_ktr to 1
	if (combination_sum == 0)
		$.cookie("flashcard_type_ktr", 1)


	// randomly returns value 1, 2 or 3 based on selected kana flashcard types
	if (combination_sum == 2)
		flashcard_type = 2;
	if (combination_sum == 3)
		flashcard_type = Math.floor(Math.random() * 2) + 1;
	if (combination_sum == 4)
		flashcard_type = 3;
	if (combination_sum == 5)
		flashcard_type = Math.floor(Math.random() * 2) * 2 + 1;
	if (combination_sum == 6)
		flashcard_type = Math.floor(Math.random() * 2) + 2;
	if (combination_sum == 7)
		flashcard_type = Math.floor(Math.random() * 3) + 1;
}





// prepare and output succes rates for current flashcard
function generateSuccessRatesTable() {
	// prepare kana to roumaji score
	var correct_kana_count = checked_storage_symbols.symbols[correct_answer_index].ck;
	var total_kana_count = checked_storage_symbols.symbols[correct_answer_index].tk;

	if (total_kana_count != 0)
		var kana_succes_percentage = " (" + (correct_kana_count / total_kana_count * 100).toPrecision(4) + "%)";
	else
		var kana_succes_percentage = "";


	// prepare roumaji to kana score
	var correct_roumaji_count = checked_storage_symbols.symbols[correct_answer_index].cr;
	var total_roumaji_count = checked_storage_symbols.symbols[correct_answer_index].tr;

	if (total_roumaji_count != 0)
		var roumaji_succes_percentage = " (" + (correct_roumaji_count / total_roumaji_count * 100).toPrecision(4) + "%)";
	else
		var roumaji_succes_percentage = "";


	// prepare voice to kana score
	var correct_voice_count = checked_storage_symbols.symbols[correct_answer_index].cv;
	var total_voice_count = checked_storage_symbols.symbols[correct_answer_index].tv;

	if (total_voice_count != 0)
		var voice_succes_percentage = " (" + (correct_voice_count / total_voice_count * 100).toPrecision(4) + "%)";
	else
		var voice_succes_percentage = "";


	// prepare average score
	var correct_average_count = correct_kana_count + correct_roumaji_count + correct_voice_count;
	var total_average_count = total_kana_count + total_roumaji_count + total_voice_count;

	if (total_average_count != 0)
		var average_succes_percentage = " (" + (correct_average_count / total_average_count * 100).toPrecision(4) + "%)";
	else
		var average_succes_percentage = "";


	var succes_rates_table = "" +
		"<table>" +
		"	<th>Kana to roumaji:</th>" +
		"		<tr><td>• " + correct_kana_count + "/" + total_kana_count + kana_succes_percentage + "</td></tr>" +
		"		<tr><td class='score_padding'></td></tr>" +
		"	<th>Roumaji to kana:</th>" +
		"		<tr><td>• " + correct_roumaji_count + "/" + total_roumaji_count + roumaji_succes_percentage + "</td></tr>" +
		"		<tr><td class='score_padding'></td></tr>" +
		"	<th>Voice to kana:</th>" +
		"		<tr><td>• " + correct_voice_count + "/" + total_voice_count + voice_succes_percentage + "</td></tr>" +
		"		<tr><td class='score_padding'></td></tr>" +
		"		<tr><td class='score_padding'></td></tr>" +
		"	<th>Average:</th>" +
		"		<tr><td>• " + correct_average_count + "/" + total_average_count + average_succes_percentage + "</td></tr>" +
		"</table>";


	$("#score_table_holder").empty();
	$("#score_table_holder").append(succes_rates_table);
}







