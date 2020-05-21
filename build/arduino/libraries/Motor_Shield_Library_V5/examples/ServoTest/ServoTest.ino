
#include <Wire.h>
#include "Adafruit_MotorShield.h"
#include "Adafruit_MS_PWMServoDriver.h"

Adafruit_MotorShield AFMS = Adafruit_MotorShield(); 
Adafruit_Servo *Servo1 = AFMS.getServo(0);
Adafruit_Servo *Servo2 = AFMS.getServo(1);
Adafruit_Servo *Servo3 = AFMS.getServo(2);
Adafruit_Servo *Servo4 = AFMS.getServo(3);

void setup(){
  Serial.begin(57600);
  AFMS.begin(50);  // create with the default frequency 1.6KHz
}

void loop() {
  Servo1->writeServo(90);
  Servo2->writeServo(90);
  Servo3->writeServo(90);
  Servo4->writeServo(60);
}
