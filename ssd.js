int laser = 6;
int buttonStart = 5;
int laserSensor = A5;
int btnState;
int ledState = 0;
int laserSensorValue = 0;
int chargingPort = 7;

// checkpaperinsertion
int slotSignal;
int paperCount = 0;
const int threshold = 500;
int requiredPaper = 3;
bool isBlocked = false;

// timer
bool insertedPaper = false;
int totalCoin = 0;
int coinSlotStatus;
int chargeTime = 25;

unsigned long previousMillis = 0;
const long interval = 1000;

int hour = 0;
int min = 0;
int sec = 0;

int minOffSetValue = 0;
bool countdown = false;

void setup() {
  Serial.begin(9600);
  pinMode(laser, OUTPUT);
  pinMode(chargingPort, OUTPUT);
  pinMode(buttonStart, INPUT);  
}


void checkSensor() {
  if (slotSignal < threshold) {
	
    if (!isBlocked) {
      delay(100);
      isBlocked = true; 
      paperCount += 1;
      Serial.println("Paper Count: "+ String(paperCount));
      incrementCoin();
    }
  } else {
    isBlocked = false;    
  }
}
void incrementCoin(){
    if (paperCount >= requiredPaper) {
        coinSlotStatus = 1;
        paperCount = 0;
        totalCoin += 1;
    }

}

void timer() {
 
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    printTime();
    countDown();
  }
}

void printTime() {
  if (countdown) {
    if (hour < 10) {
      Serial.print("0"); Serial.print(hour);
    } else {
      Serial.print(hour);
    }
    
    Serial.print(":");
    
    if (min < 10) {
      Serial.print("0"); Serial.print(min);
    } else {
      Serial.print(min);
    }
    
    Serial.print(":");
    
    if (sec < 10) {
      Serial.print("0"); Serial.print(sec);
    } else {
      Serial.print(sec);
    }
    Serial.println(" ");
  }
}

void countDown() {
    if (sec > 0) {
        sec -= 1;  // Decrement seconds
    } else {  // If seconds reach zero
        if (min > 0) {
            min -= 1;  // Decrement minute
            sec = 59;  // Reset seconds to 59 after a minute is decremented
        } else {  // If both minutes and seconds are zero
            totalCoin = 0;          // Reset coin count
            countdown = false;      // Stop the countdown
            digitalWrite(chargingPort, LOW);  // Stop charging
            int computePaper = requiredPaper - paperCount;
            Serial.println("Insert "+ String(computePaper)+ " Paper To Start Charging ");
        }
    }
}

void loops(){

  while(!insertedPaper) {
  Serial.println("3rd: "+ String(ledState));
  slotSignal = analogRead(laserSensor); 
  timer();
  pinMode(laserSensor, INPUT);
  checkSensor();
    Serial.println("4th: "+ String(ledState));
    if (coinSlotStatus == 1) {

      Serial.println("THIRD: "+ String(ledState));
      countdown = true;
      insertedPaper = true;
      delay(100);


      Serial.println("Total Count: "+ String(totalCoin));

      min += (totalCoin * chargeTime) - minOffSetValue;

      Serial.println("\nCharging...\n");

      if (min >= 60) {
        hour += 1;
        min = min - 60;
      }
      if (min > 0) {
        minOffSetValue = min;
      }
      coinSlotStatus = 0;
    }
  }
}


void loop() {
  // Print the current state of ledState
 

  // Read the state of the button
  btnState = digitalRead(buttonStart);

  // If the button is pressed, toggle ledState
  if (btnState == 1) {
    // Wait until the button is released
    while (btnState == 1) {
      btnState = digitalRead(buttonStart);
    }

    // Toggle ledState: If it's on, turn it off; if it's off, turn it on
    if (ledState == 1) {
      ledState = 0;
    } else if (ledState == 0) {
      ledState = 1;
      delay(1000); // Optional delay after toggling
      Serial.println("Led OFF: " + String(ledState));
    }
  }

  // Use switch-case to handle ledState behavior
  switch (ledState) {
    case 0:
      // Turn off the charging port and laser, set insertedPaper to true
      digitalWrite(chargingPort, LOW);
      digitalWrite(laser, LOW);
      insertedPaper = true;
      break;  // Add break to avoid falling through to case 1

    case 1:
      // Turn on the charging port and laser, and call loops() function
      digitalWrite(chargingPort, HIGH);
      digitalWrite(laser, HIGH);
      loops();
      insertedPaper = false;
      break;

    default:
      // Optional: handle any unexpected ledState values
      break;
  }
}


