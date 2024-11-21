const namespace = "http://www.w3.org/2000/svg";
let gameStarted = false;
let currentGameScore = 0;
let highScore = 0;
let intrudersCrossed = 0;
let fireAnimation;
let intruderAnimation;
let addIntruderAnimation;
let intruderVelocity = 0.05;
let intruderPushGap = 3000;
let gameEnded = false;
let hasAccess;
    

// Window Initialiser and Initialisinh helper functions.
window.addEventListener("load", svgInitialiser);

async function svgInitialiser() {
    let svgElement = document.getElementById('svg-container');
    svgElement.appendChild(createJet());
    svgElement.appendChild(markTerritory());
    setHighScore();

    setScore();
    setIntrudersCrossed();

    hasAccess = await checkMicrophoneAccess();
}

function markTerritory() {
    let territoryLine = document.createElementNS(namespace, 'line');

    territoryLine.setAttribute('x1', 5);
    territoryLine.setAttribute('y1', 70);
    territoryLine.setAttribute('x2', 95);
    territoryLine.setAttribute('y2', 70);
    territoryLine.setAttribute('style', 'stroke:#171717;stroke-width:0.2');
    territoryLine.setAttribute('id', 'territory-line');

    return territoryLine;
}

function createJet() {
    let jetImage = document.createElementNS(namespace, 'image');

    jetImage.setAttribute('href', './assets/fighter-jet.png');
    jetImage.setAttribute('x', 45);
    jetImage.setAttribute('y', 75);
    jetImage.setAttribute('width', 10);
    jetImage.setAttribute('height', 10);
    jetImage.setAttribute('id', 'jet-container');

    return jetImage;
}

function setIntrudersCrossed() {
    document.getElementById('intruders-crossed').innerHTML = intrudersCrossed;
}

function setScore() {
    document.getElementById('current-game-score').innerHTML = currentGameScore;
}


// Check for keypresses and updating the position of jet on the basis of that.
window.addEventListener("keydown", (event) => {
    if (!gameStarted) return;

    updateJetPosition(event);
})

function updateJetPosition(event) {
    if (!gameStarted) {
        return;
    }

    let jetImage = document.getElementById('jet-container');
    let svgElement = document.getElementById('svg-container');

    event.preventDefault();

    if ((jetImage.getAttribute('x') == 1 && event.key == 'ArrowLeft') || (jetImage.getAttribute('x') == 89 && event.key == 'ArrowRight')) {
        return;
    }


    switch (event.key) {
        case 'ArrowRight':
            jetImage.setAttribute('x', Number.parseInt(jetImage.getAttribute('x')) + 2);
            break;
        case "ArrowLeft":
            jetImage.setAttribute('x', Number.parseInt(jetImage.getAttribute('x')) - 2);
            break;
        case " ":
            svgElement.appendChild(fire());
            const fireSound = new Audio('./assets/gun-shot-sound.mp3');
            fireSound.play();
            break;
        default:
            console.log("Error");
    }
}


// Start game and adding all the necessary animations.
async function startGame() {
    if(hasAccess){
        recognition.start();
    }

    if (gameStarted) {
        return;
    }

    let svgElement = document.getElementById('svg-container');
    svgElement.appendChild(addIntruders());

    gameStarted = true;

    addIntruderAnimation = setInterval(() => {
        svgElement.appendChild(addIntruders());
    }, intruderPushGap);

    intruderAnimation = setInterval(() => {
        animateIntruder();
    }, 1000 / 60);


    // Voice Recognition
}


// Adding Intruder Images to the SVG.
function addIntruders() {
    let intruderImage = document.createElementNS(namespace, 'image');
    intruderImage.setAttribute('href', './assets/air-intruder.png');
    intruderImage.setAttribute('x', Math.random() * (70));
    intruderImage.setAttribute('y', 0);
    intruderImage.setAttribute('width', 10);
    intruderImage.setAttribute('height', 10);
    intruderImage.setAttribute('class', 'intruder-container');

    return intruderImage;
}

// Animation for intruder.
function animateIntruder() {
    let intruders = document.getElementsByClassName('intruder-container');

    checkIfCrossed();

    Array.from(intruders).forEach((intruder) => {
        intruder.setAttribute('y', Number.parseFloat(intruder.getAttribute('y')) + intruderVelocity);
    });
}

// Check if firing has started.
let fireStarted = false;

function fire() {
    let fireContainer = document.createElementNS(namespace, 'image');

    let jetXCoordinate = Number.parseInt(document.getElementById('jet-container').getAttribute('x'));
    let jetYCoordinate = Number.parseInt(document.getElementById('jet-container').getAttribute('y'));
    fireContainer.setAttribute('href', './assets/jet-fire.png');
    fireContainer.setAttribute('x', jetXCoordinate + 2.5);
    fireContainer.setAttribute('y', jetYCoordinate - 5);
    fireContainer.setAttribute('width', 5);
    fireContainer.setAttribute('height', 5);
    fireContainer.setAttribute('class', 'fire-container');

    if (!fireStarted) {
        fireAnimation = setInterval(() => {
            animateFire();
        }, 1000 / 60);
        fireStarted = true;
    }

    return fireContainer;
}

// Animate fire Image.
function animateFire() {
    let svgElement = document.getElementById('svg-container');
    let fires = document.getElementsByClassName('fire-container');

    checkForCollisions(Array.from(fires));

    Array.from(fires).forEach((fire) => {
        if (fire.getAttribute('y') < 0) {
            svgElement.removeChild(fire);
            return;
        };
        fire.setAttribute('y', Number.parseInt(fire.getAttribute('y')) - 1);
    });
}


// Check if at any point the fire object collides with intruder object.
function checkForCollisions(fires) {
    let intruders = document.getElementsByClassName('intruder-container');

    Array.from(fires).forEach((fire) => {
        let fireX = Number.parseInt(fire.getAttribute('x'));
        let fireY = Number.parseInt(fire.getAttribute('y'));
        let fireWidth = Number.parseInt(fire.getAttribute('width'));
        let fireHeight = Number.parseInt(fire.getAttribute('height'));

        Array.from(intruders).forEach((intruder) => {
            let intruderX = Number.parseInt(intruder.getAttribute('x'));
            let intruderY = Number.parseInt(intruder.getAttribute('y'));
            let intruderWidth = Number.parseInt(intruder.getAttribute('width'));
            let intruderHeight = Number.parseInt(intruder.getAttribute('height'));

            if (fireX < (intruderX + intruderWidth - 1) &&
                fireX > (intruderX) &&
                fireY < (intruderY + intruderHeight - 1) &&
                fireY + fireHeight > intruderY) {
                let svgElement = document.getElementById('svg-container');
                svgElement.removeChild(fire);
                svgElement.removeChild(intruder);

                increaseScore();

                svgElement.appendChild(addCollisionFire(fireX, fireY - 3));
                const collisionSound = new Audio('./assets/collision-sound.mp3');
                collisionSound.play();
                setTimeout(() => {
                    let collisions = document.getElementsByClassName('collision');

                    Array.from(collisions).forEach((collision) => {
                        svgElement.removeChild(collision);
                    })
                }, 200);
            }
        });
    });
}

// Adding Collision FIre Object.
function addCollisionFire(x, y) {
    let collisionFire = document.createElementNS(namespace, 'image');
    collisionFire.setAttribute('href', './assets/collision-fire.png')
    collisionFire.setAttribute('x', x);
    collisionFire.setAttribute('y', y);
    collisionFire.setAttribute('height', 15);
    collisionFire.setAttribute('width', 15);
    collisionFire.setAttribute('class', `collision`);

    return collisionFire;
}


// Validate Name Input.
function validateName(name) {
    if (String(name).trim() == "") {
        return false;
    }
    return true;
}

// Function to read name from the user.
function getName() {
    let nameTextBox = document.getElementById('nameTextBox');
    let name = nameTextBox.value;

    if (validateName(name)) {
        document.getElementById('enteredName').innerHTML = name
        document.getElementById('instructions-container').style.visibility = 'visible';
        document.getElementById('getName-container').style.visibility = 'hidden';
        nameTextBox.value = "";
    } else {
        return;
    }
}


// Check if the intruder object has crossed the territory border.
function checkIfCrossed() {
    let intruders = document.getElementsByClassName('intruder-container');
    let territoryLine = document.getElementById('territory-line');
    let svgElement = document.getElementById('svg-container');

    Array.from(intruders).forEach((intruder) => {
        if (Number.parseInt(intruder.getAttribute('y')) > Number.parseInt(territoryLine.getAttribute('y1'))) {
            svgElement.removeChild(intruder);
            increaseIntrudersCrossed();
            document.getElementById('intruder-warning').style.visibility = 'visible';
            setTimeout(() => {
                document.getElementById('intruder-warning').style.visibility = 'hidden';
            }, 1000)
        }
    })
}

// Increase the value of no of intruders that have crosse the border.
function increaseIntrudersCrossed() {
    intrudersCrossed += 1;
    setIntrudersCrossed();
    if (intrudersCrossed == 5) {
        gameEnded = true;
        endGame();
    }
}

// Increase the score if and also set speed of intruder entry on the basis of score.
function increaseScore() {
    currentGameScore += 2;

    setScore();
    let svgElement = document.getElementById('svg-container');

    if (currentGameScore > 90) {
        intruderVelocity = 0.25;
        intruderPushGap = 500;

        clearInterval(addIntruderAnimation);

        addIntruderAnimation = setInterval(() => {
            svgElement.appendChild(addIntruders());
        }, intruderPushGap);
    }
    else if (currentGameScore > 70) {
        intruderVelocity = 0.25;
        intruderPushGap = 1000;

        clearInterval(addIntruderAnimation);

        addIntruderAnimation = setInterval(() => {
            svgElement.appendChild(addIntruders());
        }, intruderPushGap);
    }
    else if (currentGameScore > 50) {
        intruderVelocity = 0.20;
        intruderPushGap = 1500;

        clearInterval(addIntruderAnimation);

        addIntruderAnimation = setInterval(() => {
            svgElement.appendChild(addIntruders());
        }, intruderPushGap);
    }
    else if (currentGameScore > 30) {
        intruderVelocity = 0.15;
        intruderPushGap = 2000;

        clearInterval(addIntruderAnimation);

        addIntruderAnimation = setInterval(() => {
            svgElement.appendChild(addIntruders());
        }, intruderPushGap);
    }
    else if (currentGameScore > 10) {
        intruderVelocity = 0.10;
        intruderPushGap = 2500;

        clearInterval(addIntruderAnimation);

        addIntruderAnimation = setInterval(() => {
            svgElement.appendChild(addIntruders());
        }, intruderPushGap);
    }

}

// End Game function for clearing all the animations and setting the state of the game to default values.
function endGame() {
    clearInterval(fireAnimation);
    clearInterval(intruderAnimation);
    clearInterval(addIntruderAnimation);

    setHighScore();

    let svgElement = document.getElementById('svg-container').innerHTML = "";
    fireStarted = false;
    currentGameScore = 0;
    intruderPushGap = 3000;
    intruderVelocity = 0.05;
    gameStarted = false;

    svgInitialiser();
    setScore();

    if (gameEnded) {
        showEndGameMsg();
    }

    // Voice Recognition Ended.
    recognition.stop();
}

// When the game is ended, show the message.
function showEndGameMsg() {
    document.getElementById('end-game-msg').style.visibility = 'visible';
    setTimeout(() => {
        intrudersCrossed = 0;
        setIntrudersCrossed();

        document.getElementById('end-game-msg').style.visibility = 'hidden';
        gameEnded = false;
    }, 1000)
}

// Reset the dom to its initial state.
function reset() {
    endGame();
    document.getElementById('instructions-container').style.visibility = 'hidden';
    document.getElementById('getName-container').style.visibility = 'visible';
}

// Store High Score in the Local Storage so that it prevails over refreshes.
function setHighScore() {
    let localHighScore = localStorage.getItem('high-score');

    if (localHighScore) {
        if (currentGameScore > localHighScore) {
            highScore = currentGameScore;
            localStorage.setItem('high-score', highScore);
        } else {
            highScore = localHighScore;
        }
    } else {
        localStorage.setItem('high-score', highScore);
    }

    document.getElementById('high-score').innerHTML = highScore;
}


// Todo: Optimize this -> Voice Recognition

// const SpeechRecognition = window.webkitSpeechRecognition;

// let recognition = new SpeechRecognition();
// recognition.interimResults = true;
// recognition.lang = 'en-US'; // Set language

// recognition.onstart = () => {
//     console.log('Speech recognition started.');
// };

// recognition.onresult = (event) => {
//     let svgElement = document.getElementById('svg-container');
//     svgElement.appendChild(fire());
//     const fireSound = new Audio('./assets/gun-shot-sound.mp3');
//     fireSound.play();
// };

// recognition.onend = () => {
//     console.log('Speech recognition ended.');
//     recognition.start();
// };

// recognition.onerror = (event) => {
//     console.error('Error occurred in recognition: ' + event.error);
// };

// async function checkMicrophoneAccess() {
//     try {
//         await navigator.mediaDevices.getUserMedia({ audio: true });
//         return true; // Access granted
//     } catch (error) {
//         console.error('Microphone access denied:', error);
//         return false; // Access denied
//     }
// }

// document.getElementById('start').addEventListener('click', async () => {
    
// });

// document.getElementById('stop').addEventListener('click', () => {
    
// });
