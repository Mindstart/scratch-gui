#include "ZumoMotors.h"

//源
// #define PWM_L 10
// #define PWM_R 9
// #define DIR_L 8
// #define DIR_R 7
#define PWM_L 5
#define PWM_R 6
// #define DIR_L 4
// #define DIR_R 7

// #if defined(__AVR_ATmega168__) || defined(__AVR_ATmega328P__) || defined (__AVR_ATmega32U4__)
//   #define USE_20KHZ_PWM
// #endif

static boolean flipLeft = false;
static boolean flipRight = false;
static double powerNum = 0.86;//电机功率系数

static double taskPower1 = 0.87;//空载时小车电机的功率系数
static double taskPower2 = 0.86;//载满球时小车电机的功率系数

static boolean taskFlag = true;//true时，表示执行附加任务，此时是载满球的小车，功率系数应该加大

// constructor (doesn't do anything)
ZumoMotors::ZumoMotors()
{
}

// initialize timer1 to generate the proper PWM outputs to the motor drivers
void ZumoMotors::init2()
{
  pinMode(PWM_L,  OUTPUT);
  pinMode(PWM_R,  OUTPUT);
  // pinMode(DIR_L, OUTPUT);
  // pinMode(DIR_R, OUTPUT);
  pinMode(4,  OUTPUT);
  pinMode(7,  OUTPUT);

}

void ZumoMotors::setTaskFlag(boolean flag)
{
    taskFlag = flag;
}

void ZumoMotors::setPowerNum(double number)//设置小车电机的功率系数【建议取值范围0.6 - 0.9之间】
{
    powerNum = number;
}

void ZumoMotors::setPower1(double number)//设置小车空载【基础任务】时电机的功率系数【建议取值范围0.6 - 0.9之间】
{
    taskPower1 = number;
}

void ZumoMotors::setPower2(double number)//设置小车载满球【附加任务】时电机的功率系数【建议取值范围0.7 - 0.98之间】
{
    taskPower2 = number;
}

// set speed for left motor; speed is a number between -400 and 400
void ZumoMotors::setLeftSpeed(int speed)
{
  init(); // initialize if necessary
    
  boolean reverse = 0;
  
  if (speed < 0)
  {
    speed = -speed; // make speed a positive quantity
    reverse = 1;    // preserve the direction
  }
  if (speed > 400)  // Max 
    speed = 400;

  
  int value = speed * 51 / 80;
  Serial.print("Left speed=====>>");
  Serial.println(value);
  // analogWrite(PWM_L, speed * 51 / 80);
  
  analogWrite(PWM_L, (speed * 51 / 80) * powerNum);//改为统一的功率系数，根据任务类型不同，自己调用方法设置功率系数
  
  // if (taskFlag)//true时，表示执行附加任务，此时是载满球的小车，功率系数应该加大
  // {
  //   analogWrite(PWM_L, (speed * 51 / 80) * taskPower2);
  // }else{
  //   analogWrite(PWM_L, (speed * 51 / 80) * taskPower1);
  // }

  // digitalWrite(7, HIGH);
  if (reverse){
    digitalWrite(7, LOW);
  }else{
    digitalWrite(7, HIGH);
  }
    
// #ifdef USE_20KHZ_PWM
//   OCR1B = speed;
// #else
  // analogWrite(PWM_L, speed * 51 / 80); // default to using analogWrite, mapping 400 to 255
// #endif 

   /*
  // if (reverse ^ flipLeft){// flip if speed was negative or flipLeft setting is active, but not both
  
  if (value <= 0)
  {
    return;
  }
  if (reverse){
    // Serial.println("=====>>Left reverse");
    // digitalWrite(DIR_L, HIGH);    

    digitalWrite(7, HIGH);
    digitalWrite(8, LOW);
  } 
    
  else{
    // Serial.println("=====>>Left forward");
    // digitalWrite(DIR_L, LOW);
    digitalWrite(8, HIGH);
    digitalWrite(7, LOW);
  }
   */

  // digitalWrite(8, HIGH);
  // digitalWrite(7, LOW);
    

}

// set speed for right motor; speed is a number between -400 and 400
void ZumoMotors::setRightSpeed(int speed)
{
  init(); // initialize if necessary
    
  boolean reverse = 0;
  
  if (speed < 0)
  {
    speed = -speed;  // Make speed a positive quantity
    reverse = 1;  // Preserve the direction
  }
  if (speed > 400)  // Max PWM dutycycle
    speed = 400;

  
  int value = speed * 51 / 80;
  Serial.print("Right speed=====>>");
  Serial.println(value);
  // analogWrite(PWM_R, speed * 51 / 80);
  
  analogWrite(PWM_R, (speed * 51 / 80) * powerNum);//改为统一的功率系数，根据任务类型不同，自己调用方法设置功率系数

  // if (taskFlag)//true时，表示执行附加任务，此时是载满球的小车，功率系数应该加大
  // {
  //   analogWrite(PWM_R, (speed * 51 / 80) * taskPower2);
  // }else{
  //   analogWrite(PWM_R, (speed * 51 / 80) * taskPower1);
  // }
    
// #ifdef USE_20KHZ_PWM
//   OCR1A = speed;
// #else
  // analogWrite(PWM_R, speed * 51 / 80); // default to using analogWrite, mapping 400 to 255
// #endif


  // digitalWrite(4, HIGH);
  if (reverse){
    digitalWrite(4, LOW);
  }else{
    digitalWrite(4, HIGH);
  }

  // digitalWrite(4, HIGH);
  // digitalWrite(5, LOW);

  /*
  // if (reverse ^ flipRight){// flip if speed was negative or flipRight setting is active, but not both
  if (reverse){
    // Serial.println("=====>>Right reverse");
    // digitalWrite(DIR_R, HIGH);

    digitalWrite(4, LOW);
    digitalWrite(5, HIGH);
  }     
  else{
    // Serial.println("=====>>Right forward");
     // digitalWrite(DIR_R, LOW);

    digitalWrite(4, HIGH);
    digitalWrite(5, LOW);
  }
   */
   
}

// set speed for both motors
void ZumoMotors::setSpeeds(int leftSpeed, int rightSpeed)
{
  setLeftSpeed(leftSpeed);
  setRightSpeed(rightSpeed);
}

void ZumoMotors::setBackward()
{
  analogWrite(PWM_L, 150);
  analogWrite(PWM_R, 150);

  digitalWrite(7, LOW);//左轮后退
  digitalWrite(4, LOW);//右轮后退

  
}

//taskFlag为true时，表示执行附加任务，此时是载满球的小车，功率系数应该加大
// void ZumoMotors::setRightSpeed2(int speed,boolean taskFlag)
void ZumoMotors::setRightSpeed2(int speed,int taskFlag)
{
  init(); // initialize if necessary
    
  boolean reverse = 0;
  
  if (speed < 0)
  {
    speed = -speed;  // Make speed a positive quantity
    reverse = 1;  // Preserve the direction
  }
  if (speed > 400)  // Max PWM dutycycle
    speed = 400;
  
  // int value = speed * 51 / 80;
  // Serial.print("Right speed=====>>");
  // Serial.println(value);

  // analogWrite(PWM_R, speed * 51 / 80);
  // analogWrite(PWM_R, (speed * 51 / 80) * powerNum);
  if (taskFlag)//true时，表示执行附加任务，此时是载满球的小车，功率系数应该加大
  {
    analogWrite(PWM_R, (speed * 51 / 80) * taskPower2);
  }else{
    analogWrite(PWM_R, (speed * 51 / 80) * taskPower1);
  }
    

  // digitalWrite(4, HIGH);
  if (reverse){
    digitalWrite(4, LOW);
  }else{
    digitalWrite(4, HIGH);
  }
   
}

//taskFlag为true时，表示执行附加任务，此时是载满球的小车，功率系数应该加大
// void ZumoMotors::setLeftSpeed2(int speed,boolean taskFlag)
void ZumoMotors::setLeftSpeed2(int speed,int taskFlag)
{
  init(); // initialize if necessary
    
  boolean reverse = 0;
  
  if (speed < 0)
  {
    speed = -speed; // make speed a positive quantity
    reverse = 1;    // preserve the direction
  }
  if (speed > 400)  // Max 
    speed = 400;

  
  // int value = speed * 51 / 80;
  // Serial.print("Left speed=====>>");
  // Serial.println(value);

  // analogWrite(PWM_L, speed * 51 / 80);
  // analogWrite(PWM_L, (speed * 51 / 80) * powerNum);
  // 
  if (taskFlag)//true时，表示执行附加任务，此时是载满球的小车，功率系数应该加大
  {
    analogWrite(PWM_R, (speed * 51 / 80) * taskPower2);
  }else{
    analogWrite(PWM_R, (speed * 51 / 80) * taskPower1);
  }

  // digitalWrite(7, HIGH);
  if (reverse){
    digitalWrite(7, LOW);
  }else{
    digitalWrite(7, HIGH);
  }
    
}