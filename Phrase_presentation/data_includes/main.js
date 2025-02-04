PennController.ResetPrefix(null); // Shorten command names (keep this line here))

DebugOff()   // Uncomment this line only when you are 100% done designing your experiment


const voucher = b64_md5((Date.now() + Math.random()).toString()); // Voucher code generator

Header(
    // Declare global variables to store the participant's ID and demographic information
    newVar("ACCURACY", []).global()
)
 // Add the participmant info to all trials' results lines
.log( "code"   , voucher );

// Sequence of events
 Sequence("ethics", "metadata","setcounter", "instructions",randomize("experiment-exercise"), "start_experiment", rshuffle("experiment-filler", "experiment-item"), SendResults(), "end")

// ###################################################################
// Ethics agreement
// ###################################################################

newTrial("ethics",
    newHtml("ethics_explanation", "ethics.html")
        .print()
    ,
        newHtml("form", `<div class="switch_box"><input name="consent" id='consent' type="checkbox" class="obligatory switch_1"> I want to participate.</div>`)
        .print()
        ,
    newFunction( () => $("#consent").change( e=>{
        if (e.target.checked) getButton("go_to_next_page").enable()._runPromises();
        else getButton("go_to_next_page").disable()._runPromises();
    }) ).call()
    ,
    newButton("go_to_next_page", "Start the experiment")
        .cssContainer({"margin-top":"1vw", "margin-bottom":"1vw"})
        .disable()
        .print()
        .wait()
);

// ###################################################################
// Instructions
// ###################################################################

newTrial("instructions",
    newHtml("instructions_text", "instructions.html")
        .cssContainer({"margin":"1vw"})
        .print()
        ,
    newButton("go_to_exercise", "Continue")
        .cssContainer({"margin":"1vw"})
        .center()
        .print()
        .wait()
);

// ###################################################################
// Metadata recorded from an HTML questionnaire
// ###################################################################

newTrial("metadata",
    newHtml("questionnaire", "questions.html")
        .log()
        .checkboxWarning("To continue, please, tick the field '%name%'")
        .radioWarning("To continue, please, choose an option in the field '%name%'")
        .inputWarning("To continue, please, fill in the field '%name%'")
        .print()
    ,

    newButton("continue", "Continue")
        .cssContainer({"margin":"1vw"})
        .center()
        .print()
        .wait(getHtml("questionnaire").test.complete()
                  .failure(getHtml("questionnaire").warn())
));


// ###################################################################
// Final screen: explanation of the goal
// ###################################################################

newTrial("end",
    newText("<h1>Thank you very much for participating in our study!</h1><p>To receive your compensation, please send this personal code to the experimenter: <div class='fancy'><em>".concat(voucher, "</em></div></p>"))
        .cssContainer({"margin-top":"1vw", "margin-bottom":"1vw"})
        .print()
    ,

    newVar("computedAccuracy")
        .set(getVar("ACCURACY"))
        .set(v=>Math.round(v.filter(a=>a===true).length/v.length*100)),
        
    newText("accuracy")
        .text(getVar("computedAccuracy"))
        .print()
    ,

    newText("You answered % of the questions correctly: ")
        .after(getText("accuracy"))
        .print()
    ,

    newHtml("explain", "end.html")
        .print()
    ,
    // Stay on this trial forever (until tab is closed)
    newButton().wait()
)
.setOption("countsForProgressBar",false);

// ###################################################################
// Start experiment screen
// ###################################################################

newTrial( "start_experiment" ,
    newText("The main experiment begins now.")
        .css("margin-bottom", "1vw")
        .center()
        .print()
    ,
    newButton("go_to_experiment", "Continue")
        .center()
        .print()
        .wait()
);


// ###################################################################
// Questions
// ###################################################################

// Optionally inject a question into a trial
const askQuestion = (successCallback, failureCallback, waitTime) => (row) => (row.QUESTION=="1" ? [
  newText( "answer_correct" , row.CORRECT ),
  newText( "answer_wrong" , row.WRONG ),

  newCanvas("Canvas", 400, 150)
    .center()
    .add(   0 ,  0,  newText("Who or what was mentioned in the sentence?"))
    .add(   0 , 50 , newText("[ 1 ]") )
    .add( 200 , 50 , newText("[ 2 ]") )
    .add(   0 , 75 , getText("answer_correct") )
    .add( 200 , 75 , getText("answer_wrong") )
    .print()
  ,
  // Shuffle the position of the answers. Answer keys are 1 for left and 2 for right
  newSelector("answer")
    .add( getText("answer_correct") , getText("answer_wrong") )
    .shuffle()
    .keys("1","2")
    .log()
    .print()
    .once()
    .wait()
    .test.selected( "answer_correct" )
    .success.apply(null, successCallback().concat(
        [getText("answer_correct").css("border-bottom", "5px solid #F5AE01")]
    ))
    .failure.apply(null, failureCallback().concat(
        [getText("answer_wrong").css("border-bottom", "5px solid #F5AE01")]
    )),


  // Wait for feedback and to display which option was selected
  newTimer("wait", waitTime)
    .start()
    .wait()
] : []);


const askTrialQuestion = (row) => {
    if (row.TYPE === "exercise") {
        return askQuestion(
            () => [
                getVar("ACCURACY").set(v => [...v, true]),
                newText("<b>Correct answer!</b>").color("#FED671").center().print()
            ],
            () => [
                getVar("ACCURACY").set(v => [...v, false]),
                newText("<b>Wrong answer!</b>")
                    .color("#000000")
                    .center()
                    .print(),
                getText("answer_wrong").css("border-bottom", "5px solid #F5AE01"),
                newTimer("wait", 1000).start().wait()
            ],
            1000
        )(row); // This ensures that the function is invoked
    } else {
        return askQuestion(
            () => [getVar("ACCURACY").set(v => [...v, true])],
            () => [
                getVar("ACCURACY").set(v => [...v, false]),
                newText("<b>Wrong answer!</b>")
                    .color("#000000")
                    .center()
                    .print(),
                getText("answer_wrong").css("border-bottom", "5px solid #F5AE01"),
                newTimer("wait", 1000).start().wait()
            ],
            300
        )(row); // This ensures the function is invoked even for non-exercise rows with questions
    }
};


// ###################################################################
// Trial
// ###################################################################
// display a primer that can be clicked away by pressing space bar

const newPrimer = () => [
  newText('primer','*')
    .css("font-size", "3vw")
    .css("margin-top", "1vw")
    .center()
    .print(),
  newKey(" ").wait(),
  getText('primer').remove(),
];

Template("items.csv", row =>
    newTrial( "experiment-"+row.TYPE,
              newPrimer(),
           newController("SelfPacedReadingParadigmSentence", {s : row.SENTENCE, splitRegex: /\*/})
           .center()
           .print()
           .log()
           .wait()
          .remove(),
          askTrialQuestion(row))
    .log( "list"      , row.LIST)
    .log( "item"      , row.ITEM)
    .log( "condition" , row.CONDITION)
);
