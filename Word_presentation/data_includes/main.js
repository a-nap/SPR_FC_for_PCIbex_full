PennController.ResetPrefix(null); // Shorten command names (keep this line here))

//DebugOff()   // Uncomment this line only when you are 100% done designing your experiment

// Sequence of events
 Sequence("ethics", "setcounter","instructions","experiment-exercise", "start_experiment", rshuffle("experiment-filler", "experiment-item"), "metadata", SendResults(), "end")

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
    newText("<h1>Thank you very much for participating in our study!</h1>")
        .cssContainer({"margin-top":"1vw", "margin-bottom":"1vw"})
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
// Questions
// ###################################################################

// Optionally inject a question into a trial
const askQuestion = (row) => (row.QUESTION=="1" ? [
  newText( "answer_left" , row.LEFT ),
  newText( "answer_right" , row.RIGHT ),

  newCanvas("Canvas", 600, 150)
    .center()
    .add(   0 ,  0,  newText("Who or what was mentioned in the sentence?"))
    .add(   0 , 50 , newText("[ d ]") )
    .add( 300 , 50 , newText("[ j ]") )
    .add(   0 , 75 , getText("answer_left") )
    .add( 300 , 75 , getText("answer_right") )
    .print()
  ,
  // Answer keys are `d` for left and `j` for right
  newSelector("answer")
    .add( getText("answer_left") , getText("answer_right") )
    .keys("d","j")
    .log()
    .print()
    .once()
    .wait()
] : []);


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
           newController("SelfPacedReadingParadigmSentence", {s : row.SENTENCE, splitRegex: / /})
           .center()
           .print()
           .log()
           .wait()
          .remove(),
          askQuestion(row))
    .log( "list"      , row.LIST)
    .log( "item"      , row.ITEM)
    .log( "condition" , row.CONDITION)
);
