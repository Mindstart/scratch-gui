#ifndef ZumoMotors_h
#define ZumoMotors_h

#include <Arduino.h>

class ZumoMotors
{
  public:  
  
    // constructor (doesn't do anything)
    ZumoMotors();
    
    // enable/disable flipping of motors
    static void flipLeftMotor(boolean flip);
    static void flipRightMotor(boolean flip);
    
    // set speed for left, right, or both motors
    static void setLeftSpeed(int speed);
    static void setRightSpeed(int speed);
    static void setSpeeds(int leftSpeed, int rightSpeed);

    static void setBackward();

    // static void setLeftSpeed2(int speed,boolean taskFlag);//载满球和空车时的电机功率系数不能一样
    // static void setRightSpeed2(int speed,boolean taskFlag);//载满球和空车时的电机功率系数不能一样
    
    static void setTaskFlag(boolean flag);//true时，表示执行附加任务，此时是载满球的小车，功率系数应该加大

    static void setPower1(double number);//设置小车空载时电机的功率系数【建议取值范围0.6 - 0.9之间】
    static void setPower2(double number);//设置小车载满球时电机的功率系数【建议取值范围0.7 - 0.98之间】
    

    static void setLeftSpeed2(int speed,int taskFlag);//载满球和空车时的电机功率系数不能一样
    static void setRightSpeed2(int speed,int taskFlag);//载满球和空车时的电机功率系数不能一样
    
  private:

    static inline void init()
    {
      static boolean initialized = false;

      if (!initialized)
      {
        initialized = true;
        init2();
      }
    }
    
    // initializes timer1 for proper PWM generation
    static void init2();
};

#endif