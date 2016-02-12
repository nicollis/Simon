var ButtonEnum = {
  GREEN: 0,
  RED: 1,
  YELLOW: 2,
  BLUE: 3
}

//button id list
var ButtonIdEnum = {
  0: "#green",
  1: "#red",
  2: "#yellow",
  3: "#blue"
}

//button on color classes
var ButtonOnClass = {
  0: "green-on",
  1: "red-on",
  2: "yellow-on",
  3: "blue-on"
}

var ButtonSounds = [];
var CommandOrder = [];
var playerStep = 0;

var isOn = false;
var strictModeOn = false;
var lockControls = true;
var lastColorPressed;
var mousePressTimeout = null;
var userDeadTimeout = null;

function init() {
  $("#green").mousedown(function(event) {
    onColorPress(ButtonEnum.GREEN, true);
  });
  $("#green").mouseup(function(event) {
    onColorPress(ButtonEnum.GREEN, false);
  });
  $("#red").mousedown(function(event) {
    onColorPress(ButtonEnum.RED, true);
  });
  $("#red").mouseup(function(event) {
    onColorPress(ButtonEnum.RED, false);
  });
  $("#yellow").mousedown(function(event) {
    onColorPress(ButtonEnum.YELLOW, true);
  });
  $("#yellow").mouseup(function(event) {
    onColorPress(ButtonEnum.YELLOW, false);
  });
  $("#blue").mousedown(function(event) {
    onColorPress(ButtonEnum.BLUE, true);
  });
  $("#blue").mouseup(function(event) {
    onColorPress(ButtonEnum.BLUE, false);
  });
  $("#start").click(function(event) {
    onStart();
  });
  $("#strict").click(function(event) {
    onStrict();
  });
  $("#onoffswitch").click(function(event) {
    onSwitch(this.checked);
  });
  //Pre load sounds
  ButtonSounds[ButtonEnum.GREEN] =
    new Audio('https://s3.amazonaws.com/freecodecamp/simonSound1.mp3');
  ButtonSounds[ButtonEnum.RED] =
    new Audio('https://s3.amazonaws.com/freecodecamp/simonSound2.mp3');
  ButtonSounds[ButtonEnum.YELLOW] =
    new Audio('https://s3.amazonaws.com/freecodecamp/simonSound3.mp3');
  ButtonSounds[ButtonEnum.BLUE] =
    new Audio('https://s3.amazonaws.com/freecodecamp/simonSound4.mp3');
}

function onColorPress(buttonEnumColor, onMouseDown) {
  if (lockControls || !isOn) {
    return;
  }
  //Clear user dead timeout as action as been taken
  if (userDeadTimeout != null) {
    clearInterval(userDeadTimeout);
    userDeadTimeout = null;
  }
  //If clicking on a color, light up and play sound until timeout or release
  if (onMouseDown) {
    lastColorPressed = buttonEnumColor;
    //Active button color
    $(ButtonIdEnum[buttonEnumColor]).addClass(ButtonOnClass[buttonEnumColor]);
    ButtonSounds[buttonEnumColor].play();
    //Set timeout for button press
    if (mousePressTimeout != null) {
      clearInterval(mousePressTimeout);
    }
    mousePressTimeout = setInterval(function() {
      onColorPress(buttonEnumColor, false);
    }, 2000);
  } else { //On timeout or release set state back to normal
    //set lastColorPressed as temp buttonEnumColor and set lastColorPressed to null to avoid double release
    if (lastColorPressed == null) {
      return;
    } else {
      buttonEnumColor = lastColorPressed;
      lastColorPressed = null;
    }
    $(ButtonIdEnum[buttonEnumColor]).removeClass(ButtonOnClass[buttonEnumColor]);
    //On mouse up clear timer and set to null
    clearInterval(mousePressTimeout);
    mousePressTimeout = null;
    //Test value to see if correct step in pattren
    console.log(buttonEnumColor, CommandOrder[playerStep], playerStep, CommandOrder);
    if (buttonEnumColor != CommandOrder[playerStep]) { //Player missed Step!
      dead();
      return;
    } else { //Player hit right order; let them move to next, if at end let computer play
      if (playerStep == CommandOrder.length - 1) {
        setTimeout(function() {
          updateLcd(CommandOrder.length + 1);
          gameLoop(0);
        }, 1000);
      } else {
        ++playerStep;
        //Start new user dead timout if user is afk for 5 seconds
        userDeadTimeout = setInterval(function() {
          dead();
        }, 5000);
      }
    }
  }
}

//step keeps track of what button in the command order we are in
//skip new is used by "afterDeath" to skip making a new step if the user has failed
function gameLoop(step, skipNew) {
  if (!isOn) {
    return;
  }
  lockControls = true;
  if (step == null) {
    step = 0;
  }
  //If CommandOrder is empty then LCD has not been set, set to 1
  if (CommandOrder.length == 0) {
    updateLcd(1);
  }
  if (CommandOrder.length >= 20) {
    //user got to 20 they win!
    var response = confirm("Congrats you won the game!");
    onRestart();
  }
  //If step is at end of array then add a new color!
  if (step == CommandOrder.length) {
    if (skipNew == null) {
      //Pick random color
      var new_color = Math.floor(Math.random() * 4);
      //Lights button / Play sound / Unlock Controls
      $(ButtonIdEnum[new_color]).addClass(ButtonOnClass[new_color]);
      setTimeout(
        function() {
          $(ButtonIdEnum[new_color]).removeClass(ButtonOnClass[new_color]);
        }, 500);
      ButtonSounds[new_color].play();
      CommandOrder.push(new_color);
    }
    lockControls = false;
    playerStep = 0;
    //Start user dead timout for 5 seconds
    userDeadTimeout = setInterval(function() {
      dead();
    }, 5000);
  } else { //If Step is not at end of array then play color at step
    //Light up button for 500ms and play sound
    $(ButtonIdEnum[CommandOrder[step]]).addClass(ButtonOnClass[CommandOrder[step]]);
    setTimeout(
      function() {
        $(ButtonIdEnum[CommandOrder[step]]).removeClass(ButtonOnClass[CommandOrder[step]]);
      }, 500);
    ButtonSounds[CommandOrder[step]].play();
    //sleep for 1000ms and play next step;
    setTimeout(function() {
      gameLoop(++step, skipNew);
    }, 1000);
  }
}

function dead() {
  if (!isOn) {
    return;
  }
  if (userDeadTimeout != null) {
    clearInterval(userDeadTimeout);
    userDeadTimeout = null;
  }
  lockControls = true;
  playerStep = 0;
  flashDisplay("! !", true, 0, afterDeath);
}

function afterDeath() {
  //If player is playing on strict mode then game resets
  if (strictModeOn) {
    onReset();
    //restart game
    gameLoop(); //dont pass variable and screen with reset to 01;
  } else {
    //user not playing on strict mode, reset display and start game loop
    updateLcd(CommandOrder.length);
    gameLoop(0, true);
  }
}

function onStart() {
  if (!isOn) {
    return;
  }
  //if commands are in que game is ongoing, so reset!
  if (CommandOrder.length != 0) {
    onReset();
    return;
  }
  //flash -- on and off the LCD 3 times then start game loop
  flashDisplay("--", true, 0, gameLoop);
}

function onStop() {
  //Clear command list 
  CommandOrder = [];
  playerStep = 0;
  if (userDeadTimeout != null) {
    clearInterval(userDeadTimeout);
    userDeadTimeout = null;
  }
  lockControls = true;
  isOn = false;
}

function onReset() {
  onStop();
  setTimeout(function() {
    isOn = true;
    onStart();
  }, 500);
}

function flashDisplay(text, displayOn, flashCount, callback) {
  if (!isOn) {
    return;
  }
  if (flashCount >= 3) {
    callback();
    return;
  }
  //set display text
  $("#lcd").html(text);
  //turn display on or off
  if (displayOn) {
    $("#lcd").removeClass("lcd-on");
  } else {
    $("#lcd").addClass("lcd-on");
    flashCount++
  }
  //set timer for next flash
  setTimeout(function() {
    flashDisplay(text, !displayOn, flashCount, callback)
  }, 500);
}

function onStrict() {
  if (!isOn) {
    return;
  }
  if (!strictModeOn) {
    //turn on!
    $("#strict-light").addClass("strict-light-on");
    strictModeOn = true;
  } else {
    //turn off!
    $("#strict-light").removeClass("strict-light-on");
    strictModeOn = false;
  }
}

function onSwitch(isChecked) {
  isOn = isChecked;
  if (isOn) {
    //Turn on things
    //turn on LCD
    $("#lcd").addClass("lcd-on");
  } else {
    //Make sure things are of
    onStop();
    //turn off strict mode!
    $("#strict-light").removeClass("strict-light-on");
    strictModeOn = false;
    //turn off LCD
    $("#lcd").removeClass("lcd-on");
    $("#lcd").html("--");
  }
}

function updateLcd(display) {
  if (typeof display == "number") {
    display = display < 10 ? "0" + display : display;
  }
  $("#lcd").html(display);
}

$(document).ready(init());