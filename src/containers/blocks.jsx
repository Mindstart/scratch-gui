import bindAll from 'lodash.bindall';
import debounce from 'lodash.debounce';
import defaultsDeep from 'lodash.defaultsdeep';
import makeToolboxXML from '../lib/make-toolbox-xml';
import PropTypes from 'prop-types';
import React from 'react';
import VMScratchBlocks from '../lib/blocks';
import VM from 'scratch-vm';

import log from '../lib/log.js';
import analytics from '../lib/analytics';
import Prompt from './prompt.jsx';
import ConnectionModal from './connection-modal.jsx';
import BlocksComponent from '../components/blocks/blocks.jsx';
import ExtensionLibrary from './extension-library.jsx';
import extensionData from '../lib/libraries/extensions/index.jsx';
import CustomProcedures from './custom-procedures.jsx';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import { STAGE_DISPLAY_SIZES } from '../lib/layout-constants';
import DropAreaHOC from '../lib/drop-area-hoc.jsx';
import DragConstants from '../lib/drag-constants';

import { connect } from 'react-redux';
import { updateToolbox } from '../reducers/toolbox';
import { activateColorPicker } from '../reducers/color-picker';
import { closeExtensionLibrary, openSoundRecorder, openConnectionModal } from '../reducers/modals';
import { activateCustomProcedures, deactivateCustomProcedures } from '../reducers/custom-procedures';
import { setConnectionModalExtensionId } from '../reducers/connection-modal';

import {
    activateTab,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';

import Blockly from 'scratch-blocks';

Blockly.Arduino = new Blockly.Generator('Arduino');
Blockly.Arduino.addReservedWords('_,void,char');
Blockly.Arduino.ORDER_ATOMIC = 0;
Blockly.Arduino.ORDER_HIGH = 1;
Blockly.Arduino.ORDER_EXPONENTIATION = 2;
Blockly.Arduino.ORDER_UNARY = 3;
Blockly.Arduino.ORDER_MULTIPLICATIVE = 4;
Blockly.Arduino.ORDER_ADDITIVE = 5;
Blockly.Arduino.ORDER_CONCATENATION = 6;
Blockly.Arduino.ORDER_RELATIONAL = 7;
Blockly.Arduino.ORDER_AND = 8;
Blockly.Arduino.ORDER_OR = 9;
Blockly.Arduino.ORDER_NONE = 99;
Blockly.Arduino.Null = 0;
Blockly.Arduino.Setup = 1;
Blockly.Arduino.Loop = 2;
Blockly.Arduino.INDENT = '\t';
Blockly.Arduino.END = ';\n';
Blockly.Arduino.Header = '#include <Arduino.h>\n';
Blockly.Arduino.topblockList = ['arduino_arduinostart'];
Blockly.Arduino.init = function (a) {
    Blockly.Arduino.definitions_ = Object.create(null);
    Blockly.Arduino.includes_ = Object.create(null);
    Blockly.Arduino.functions_ = Object.create(null);
    Blockly.Arduino.variables_ = Object.create(null);
    Blockly.Arduino.setups_ = Object.create(null);
    Blockly.Arduino.loops_ = Object.create(null);
    Blockly.Arduino.codeStage = Blockly.Arduino.Setup;
    Blockly.Arduino.tabPos = 1;
    Blockly.Arduino.setupLists_ = [];
    Blockly.Arduino.loopLists_ = [];
    Blockly.Arduino.configH_ = {};
    Blockly.Arduino.variableDB_ ? Blockly.Arduino.variableDB_.reset() : Blockly.Arduino.variableDB_ = new Blockly.Names(Blockly.Arduino.RESERVED_WORDS_);
    Blockly.Arduino.variableDB_.setVariableMap(a.getVariableMap());

};
Blockly.Arduino.finish = function (a) {
    var b = [];
    for (var x in Blockly.Arduino.definitions_) b.push(Blockly.Arduino.definitions_[x]);
    var c = [];
    for (var p in Blockly.Arduino.includes_) c.push(Blockly.Arduino.includes_[p]);
    var f = [];
    for (var l in Blockly.Arduino.functions_) f.push(Blockly.Arduino.functions_[l]);
    var m = [];
    for (var t in Blockly.Arduino.variables_) m.push(Blockly.Arduino.variables_[t]);

    var s = [];
    for (var r in Blockly.Arduino.setups_) s.push(Blockly.Arduino.INDENT + Blockly.Arduino.setups_[r]);
    s = s.join('\n');
    s = s + '\n';
    s = s.concat(Blockly.Arduino.setupLists_);
    var u = [];
    for (var g in Blockly.Arduino.loops_) u.push(Blockly.Arduino.INDENT + Blockly.Arduino.loops_[g]);
    u = u.join('\n');
    u = u + '\n';
    u = u.concat(Blockly.Arduino.loopLists_);

    var d = Blockly.Arduino.Header;
    d += c.join('\n');
    d = `${d}\n${m.join('\n')}`;
    d = `${d}\n${f.join('\n')}`;
    d = `${d}\n${b.join('\n')}`;
    d = `${d}\nvoid setup(){\n`;
    d = d + s;
    d = `${d}\n}\n`;
    d += `\nvoid loop(){\n${u}\n}\n`;

    Blockly.Arduino.setupLists_ = [];
    Blockly.Arduino.loopLists_ = [];
    Blockly.Arduino.configH_ = {};
    delete Blockly.Arduino.definitions_;
    delete Blockly.Arduino.includes_;
    delete Blockly.Arduino.variables_;
    delete Blockly.Arduino.codeStage;
    delete Blockly.Arduino.functions_;
    delete Blockly.Arduino.setups_;
    delete Blockly.Arduino.loops_;

    console.log(`finish function`);

    return d;
};

Blockly.Arduino.workspaceToCode = function (e) {
    Blockly.Arduino.blockInfo = Blockly.Arduino.name_, Blockly.Arduino.init(e);
    console.log(`hello world`);

    for (var block, blockArr = e.getTopBlocks(true), n = 0; block = blockArr[n]; n++) {
        var containTopBlock = false, topBlock;
        if (void 0 !== Blockly.Arduino.topblockList) {
            for (var i in Blockly.Arduino.topblockList) {
                if (-1 !== (topBlock = Blockly.Arduino.topblockList[i]).indexOf(block.type)) {
                    containTopBlock = true;
                    break;
                }
            }
        }
        if (containTopBlock) {
            Blockly.Arduino.topblock = topBlock;
            var code = Blockly.Arduino.blockToCode(block);
            console.log(`n=${n}, block code=${code}`);
        }
    }

    return Blockly.Arduino.finish();
};

Blockly.Arduino.statementToCode = function (block, name) {
    var A = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null,
        n = Blockly.Arduino.codeStage;
    Blockly.Arduino.codeStage = A || Blockly.Arduino.Branch;
    var o = block.getInputTargetBlock(name),
        r = Blockly.Arduino.blockToCode(o);
    return r && (r = Blockly.Arduino.prefixLines(r, Blockly.Arduino.INDENT)), Blockly.Arduino.codeStage = n, r
}

Blockly.Arduino.scrub_ = function (block, code) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = Blockly.Arduino.blockToCode(nextBlock);
    return code + nextCode;
};
Blockly.Arduino.scrubNakedValue = function (a) {
    return `${a}\n`;
};
Blockly.Arduino.quote_ = function (a) {
    return a = a.replace(/\\/g, '\\\\').replace(/\n/g, '\\\n')
        .replace(/%/g, '\\%')
        .replace(/'/g, "\\'");
};
Blockly.Arduino.tab = function () {
    return Blockly.Arduino.INDENT.repeat(Blockly.Arduino.tabPos);
};
Blockly.Arduino.arduino = {};
Blockly.Arduino.event_arduinobegin = function (a) {
};
Blockly.Arduino.arduino_arduinostart = function (a) {
    Blockly.Arduino.tabPos = 0;
    const t = Blockly.Arduino.statementToCode(a, 'SUBSTACK');
    Blockly.Arduino.setupLists_.push(t);
    const b = Blockly.Arduino.statementToCode(a, 'SUBSTACK2');
    Blockly.Arduino.loopLists_.push(b);
};

Blockly.Arduino.arduino_pin_mode = function (a) {
    const b = Blockly.Arduino.ORDER_NONE; const c = Blockly.Arduino.valueToCode(a, 'PIN', b);
    a = Blockly.Arduino.valueToCode(a, 'MODE', b);
    return `pinMode(${c},${a})${Blockly.Arduino.END}`;
};
Blockly.Arduino.arduino_serial_begin = function (a) {
    const baud = Blockly.Arduino.valueToCode(a, 'Baud', Blockly.Arduino.ORDER_ATOMIC);
    return `Serial.begin(${baud});\n`;
};
Blockly.Arduino.arduino_serial_print = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'NL', Blockly.Arduino.ORDER_ATOMIC);
    a = Blockly.Arduino.valueToCode(a, 'VALUE', Blockly.Arduino.ORDER_ATOMIC);
    if (a.indexOf('(') === 0 || (a.indexOf('()') !== -1) || (a.indexOf('(') > 0 && a.indexOf(')') > 0)) {
        if (b === 'nowarp') {
            return `Serial.print(${a})${Blockly.Arduino.END}`;
        }
        return `Serial.println(${a})${Blockly.Arduino.END}`;

    }
    if (b === 'nowarp') {
        return `Serial.print("${a}")${Blockly.Arduino.END}`;
    }
    return `Serial.println("${a}")${Blockly.Arduino.END}`;

};
Blockly.Arduino.arduino_pwm_write = function (a) {
    const b = Blockly.Arduino.ORDER_NONE;
    const c = Blockly.Arduino.valueToCode(a, 'PIN', b);
    a = Blockly.Arduino.valueToCode(a, 'VALUE', b);
    return `analogWrite(${c},${a})${Blockly.Arduino.END}`;
};
Blockly.Arduino.arduino_digital_write = function (a) {
    const b = Blockly.Arduino.ORDER_NONE;
    const c = Blockly.Arduino.valueToCode(a, 'PIN', b);
    a = Blockly.Arduino.valueToCode(a, 'LEVEL', b);
    return `digitalWrite(${c},${a})${Blockly.Arduino.END}`;
};
Blockly.Arduino.arduino_digital_read = function (a) {
    const b = Blockly.Arduino.ORDER_NONE;
    return [`digitalRead(${Blockly.Arduino.valueToCode(a, 'PIN', b)})`, b];
};
Blockly.Arduino.arduino_analog_read = function (a) {
    const b = Blockly.Arduino.ORDER_NONE;
    return [`analogRead(${Blockly.Arduino.valueToCode(a, 'PIN', b)})`, b];
};
Blockly.Arduino.arduino_map = function (a) {
    const b = Blockly.Arduino.ORDER_NONE; const c = Blockly.Arduino.valueToCode(a, 'VAL', b);
    const d = Blockly.Arduino.valueToCode(a, 'FROMLOW', b); const e = Blockly.Arduino.valueToCode(a, 'FROMHIGH', b);
    const f = Blockly.Arduino.valueToCode(a, 'TOLOW', b);
    a = Blockly.Arduino.valueToCode(a, 'TOHIGH', b);
    return [`map(${c},${d},${e},${f},${a})`, b];
};
Blockly.Arduino.arduino_tone = function (a) {
    const b = Blockly.Arduino.ORDER_NONE; const c = Blockly.Arduino.valueToCode(a, 'PINNUM', b);
    const d = Blockly.Arduino.valueToCode(a, 'FREQUENCY', b);
    a = Blockly.Arduino.valueToCode(a, 'DURATION', b);
    return `${Blockly.Arduino.INDENT}tone(${c},${d},${a})${Blockly.Arduino.END}`;
};
Blockly.Arduino.arduino_servo_write = function (a) {
    const b = Blockly.Arduino.ORDER_NONE;
    Blockly.Arduino.includes_.servo = '#include <Servo.h>';
    Blockly.Arduino.definitions_.servo = 'Servo servo;';
    let c = Blockly.Arduino.valueToCode(a, 'PIN', b);
    a = Blockly.Arduino.valueToCode(a, 'DEGREE', b);
    c = `${Blockly.Arduino.INDENT}servo.attach(${c})${Blockly.Arduino.END}`;
    Blockly.Arduino.setups_.servo = c;
    return `servo.write(${a})${Blockly.Arduino.END}`;
};
Blockly.Arduino.arduino_menu = function (a) {
    return [a.inputList[1].fieldRow[0].value_, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_println = function (a) {
    a = Blockly.Arduino.valueToCode(a, 'TEXT', Blockly.Arduino.ORDER_NONE);
    return a.indexOf('(') > -1 ? `${Blockly.Arduino.INDENT}Serial.println(${a})${Blockly.Arduino.END}` : `${Blockly.Arduino.INDENT}Serial.println("${a}")${Blockly.Arduino.END}`;
};
Blockly.Arduino.arduino_pin_mode_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_digital_write_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_pwm_write_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_digital_read_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_analog_read_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_pwm_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_level_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_port_mode_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_analog_in_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_variable_type_option = Blockly.Arduino.arduino_menu;
Blockly.Arduino.arduino_baudrate_option = Blockly.Arduino.arduino_menu_baudrate;
Blockly.Arduino.arduino_newLine_option = Blockly.Arduino.arduino_menu_newLine;
Blockly.Arduino.control = {};
Blockly.Arduino.control_wait = function (a) {
    a = `${Blockly.Arduino.valueToCode(a, 'DURATION', Blockly.Arduino.ORDER_HIGH)}*1000`;
    return `delay(${a})${Blockly.Arduino.END}`;
};
Blockly.Arduino.control_repeat = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'TIMES', Blockly.Arduino.ORDER_HIGH);
    let c = Blockly.Arduino.statementToCode(a, 'SUBSTACK');
    c = Blockly.Arduino.addLoopTrap(c, a.id);
    a = `for(int i=0;i<${b};i++){\n`;
    Blockly.Arduino.tabPos++;
    Blockly.Arduino.tabPos--;
    return a = `${a + c}}\n`;
};
Blockly.Arduino.control_forever = function (a) {
    let b = `while(1){\n`;
    Blockly.Arduino.tabPos++;
    let c = Blockly.Arduino.statementToCode(a, 'SUBSTACK');
    c = Blockly.Arduino.addLoopTrap(c, a.id);
    Blockly.Arduino.tabPos--;
    return b = `${b + c}}\n`;
};
Blockly.Arduino.control_if = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'CONDITION', Blockly.Arduino.ORDER_NONE) || 'false';
    let c = Blockly.Arduino.statementToCode(a, 'SUBSTACK');
    c = Blockly.Arduino.addLoopTrap(c, a.id);
    a = `if(${b}){\n`;
    Blockly.Arduino.tabPos++;
    Blockly.Arduino.tabPos--;
    return a = `${a + c}}\n`;
};
Blockly.Arduino.control_if_else = function (a) {
    let b = Blockly.Arduino.valueToCode(a, 'CONDITION', Blockly.Arduino.ORDER_NONE) || 'false';
    let c = Blockly.Arduino.statementToCode(a, 'SUBSTACK');
    c = Blockly.Arduino.addLoopTrap(c, a.id);
    let d = Blockly.Arduino.statementToCode(a, 'SUBSTACK2');
    d = Blockly.Arduino.addLoopTrap(d, a.id);
    b = `if(${b}){\n`;
    Blockly.Arduino.tabPos++;
    Blockly.Arduino.tabPos--;
    b = `${b + c}}else{\n`;
    Blockly.Arduino.tabPos++;
    Blockly.Arduino.tabPos--;
    return b = `${b + d}}\n`;
};
Blockly.Arduino.control_repeat_until = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'CONDITION', Blockly.Arduino.ORDER_NONE) || 'false';
    const c = Blockly.Arduino.statementToCode(a, 'SUBSTACK');
    a = `while(!(${b})){\n`;
    Blockly.Arduino.tabPos++;
    Blockly.Arduino.tabPos--;
    return a = `${a + c}}\n`;
};
Blockly.Arduino.control_wait_until = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'CONDITION', Blockly.Arduino.ORDER_NONE) || 'false';
    const c = Blockly.Arduino.statementToCode(a, 'SUBSTACK');
    a = `while(!(${b})){\n`;
    Blockly.Arduino.tabPos++;
    Blockly.Arduino.tabPos--;
    return a = `${a + c}}\n`;
};
Blockly.Arduino.looks_say = function (a) {
    a = Blockly.Arduino.valueToCode(a, 'MESSAGE', Blockly.Arduino.ORDER_ATOMIC);
    return `${Blockly.Arduino.INDENT}Serial.println(String('${a}'));\n`;
};
Blockly.Arduino.event = {};
Blockly.Arduino.event_whenflagclicked = function (a) {
    return '';
};
Blockly.Arduino.operator = {};
Blockly.Arduino.math_number = function (a) {
    const str = a.toLocaleString();
    console.info(`math_number= ${a.toLocaleString()}`);
    if ((str.indexOf('.') !== -1) && (parseFloat(a.getFieldValue('NUM')) === parseInt(a.getFieldValue('NUM'), 0))) {
        return [parseFloat(a.getFieldValue('NUM')).toFixed(1), Blockly.Arduino.ORDER_ATOMIC];
    }
    return [parseFloat(a.getFieldValue('NUM')), Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_menu_pinMode = function (a) { // TODO: Fix the following method using value from build menu
    const str = a.toString();
    let retValue = 0;
    if (str === 'Input' || str === '输入') {
        retValue = 'INPUT';
    } else if (str === 'Output' || str === '输出') {
        retValue = 'OUTPUT';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_menu_digitalPin = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_menu_pwmPin = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_menu_analogPin = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_menu_pinLevel = function (a) {
    let str = a.toString();
    str = str.toUpperCase();
    let retValue = 0;
    if (str === 'LOW' || str === '低电平') {
        retValue = 'LOW';
    } else if (str === 'HIGH' || str === '高电平') {
        retValue = 'HIGH';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_pinLevel = function (a) {
    let str = a.toString();
    str = str.toUpperCase();
    let retValue = 0;
    if (str === 'LOW' || str === '低电平') {
        retValue = 'LOW';
    } else if (str === 'HIGH' || str === '高电平') {
        retValue = 'HIGH';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_axis = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'x') {
        retValue = 'x';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_vectorDirect = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'head(arrow end)' || str === '头部（箭头末端）') {
        retValue = 'head';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_which = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'right front' || str === '右前轮') {
        retValue = 'rightfront';
    } else if (str === 'left front' || str === '左前轮') {
        retValue = 'leftfront';
    } else if (str === 'right back' || str === '右后轮') {
        retValue = 'rightback';
    } else if (str === 'left back' || str === '左后轮') {
        retValue = 'leftback';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_wheelDirect = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'forward' || str === '正转') {
        retValue = 'forward';
    } else if (str === 'reverse' || str === '反转') {
        retValue = 'reverse';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_wheelStatus = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'forward' || str === '前进') {
        retValue = 'forward';
    } else if (str === 'back' || str === '后退') {
        retValue = 'back';
    } else if (str === 'stop' || str === '停止') {
        retValue = 'stop';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_pinLevel = function (a) {
    let str = a.toString();
    str = str.toUpperCase();
    let retValue = 0;
    if (str === 'LOW' || str === '低电平') {
        retValue = 'LOW';
    } else if (str === 'HIGH' || str === '高电平') {
        retValue = 'HIGH';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_boolVal = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'false' || str === '否') {
        retValue = 'LOW';
    } else if (str === 'true' || str === '是') {
        retValue = 'HIGH';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_commonBool = function (a) {
    let str = a.toString();
    str = str.toLowerCase();
    let retValue = 0;
    if (str === 'false' || str === '否' || str === 'disable') {
        retValue = 0;
    } else if (str === 'true' || str === '是' || str === 'enable') {
        retValue = 1;
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_comType = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'cathode' || str === '共阴') {
        retValue = 0;
    } else if (str === 'anode' || str === '共阳') {
        retValue = 1;
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_roboRaveTaskType = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'Basic' || str === '基础') {
        retValue = 'false';
    } else if (str === 'Pro' || str === '附加') {
        retValue = 'true';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_direction = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'Left' || str === '左边') {
        retValue = 'Left';
    } else if (str === 'Right' || str === '右边') {
        retValue = 'Right';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_vectorType = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'Found The Vector' || str === '发现向量') {
        retValue = '0';
    } else if (str === 'Error Or Nothing Detected' || str === '未检测到标识') {
        retValue = '1';
    } else if (str === 'Arrow Pointing Up' || str === '箭头向上') {
        retValue = '2';
    } else if (str === 'Intersection Is Present' || str === '出现急弯道') {
        retValue = '3';
    } else if (str === 'Found Intersection' || str === '发现交叉路口') {
        retValue = '4';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_pixy2Command = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'Refresh Data In Tracking Mode' || str === '获取传感器数据') {
        retValue = '0';
    } else if (str === 'Calculate Left And Right Wheel Speed' || str === '计算左右车轮速度') {
        retValue = '1';
    } else if (str === 'Slow Down' || str === '减速') {
        retValue = '2';
    } else if (str === 'Boost' || str === '加速') {
        retValue = '3';
    } else if (str === 'Reverse Vector' || str === '反转向量') {
        retValue = '4';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_digitalPin = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_digitalPin = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_segment1Pin = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_segment2Pin = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_segmentNum = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_analogPin = function (a) {
    const str = a.toString();
    return [str, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_dht11Type = function (a) {
    const str = a.toString();
    let retValue = '';
    if (str === 'temperature' || str === '温度') {
        retValue = 'temperature';
    } else if (str === 'humidity' || str === '湿度') {
        retValue = 'humidity';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_timeType = function (a) {
    const str = a.toString();
    let retValue = '';
    if (str === 'year' || str === '年') {
        retValue = 'year';
    } else if (str === 'month' || str === '月') {
        retValue = 'month';
    } else if (str === 'date' || str === '日') {
        retValue = 'date';
    } else if (str === 'hour' || str === '时') {
        retValue = 'hour';
    } else if (str === 'minute' || str === '分') {
        retValue = 'minute';
    } else if (str === 'seconde' || str === '秒') {
        retValue = 'second';
    } else if (str === 'day' || str === '星期') {
        retValue = 'day';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_portMode = function (a) {
    const str = a.toString();
    let retValue = 0;
    if (str === 'Port 1 (Digital)' || str === '端口1 (数字)') {
        retValue = 12;
    } else if (str === 'Port 2 (Digital)' || str === '端口2 (数字)') {
        retValue = 13;
    } else if (str === 'Port 3 (Analog)' || str === '端口3 (模拟)') {
        retValue = 0;
    } else if (str === 'Port 4 (Analog)' || str === '端口4 (模拟)') {
        retValue = 1;
    } else if (str === 'Port 5 (Analog)' || str === '端口5 (模拟)') {
        retValue = 2;
    } else if (str === 'Port 6 (Analog)' || str === '端口6 (模拟)') {
        retValue = 3;
    } else if (str === 'Port 7 (PWM)' || str === '端口7 (PWM)') {
        retValue = 3;
    } else if (str === 'Port 8 (PWM)' || str === '端口8 (PWM)') {
        retValue = 9;
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_menu_varType = function (a) {
    const str = a.toString();
    let retValue = 'String';
    if (str === 'Integer' || str === '整数') {
        retValue = 'int';
    } else if (str === 'Long' || str === '长整数') {
        retValue = 'long';
    } else if (str === 'Double' || str === '双整数') {
        retValue = 'double';
    } else if (str === 'Char' || str === '字符') {
        retValue = 'char';
    } else if (str === 'String' || str === '字符串') {
        retValue = 'String';
    } else if (str === 'Float' || str === '浮点数') {
        retValue = 'float';
    } else if (str === 'Byte' || str === '字节') {
        retValue = 'byte';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_menu_baudrate = function (a) {
    return [a.toString(), Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.arduino_menu_newLine = function (a) {
    const str = a.toString();
    let retValue = '';
    if (str === 'WARP' || str === '换行') {
        retValue = 'warp';
    } else if (str === 'NO WARP' || str === '不换行') {
        retValue = 'nowarp';
    }
    return [retValue, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_oss = function (a) {
    return [a.toString(), Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_bmpData = function (a) {
    if (a === 'temperature') {
        return [0, Blockly.Arduino.ORDER_ATOMIC];
    } else if (a === 'pressure') {
        return [1, Blockly.Arduino.ORDER_ATOMIC];
    } else if (a === 'altitude') {
        return [2, Blockly.Arduino.ORDER_ATOMIC];
    }
};
Blockly.Arduino.sensor_menu_dataType = function (a) {
    return [a.toString(), Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_menu_lcdLine = function (a) {
    return [a.toString(), Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_menu_oss = function (a) {
    if (a.toString() === 'Single') {
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    } else if (a.toString() === '2 times') {
        return ['1', Blockly.Arduino.ORDER_ATOMIC];
    } else if (a.toString() === '4 times') {
        return ['2', Blockly.Arduino.ORDER_ATOMIC];
    } else if (a.toString() === '8 times') {
        return ['3', Blockly.Arduino.ORDER_ATOMIC];
    }
    return ['1', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.text = function (a) {
    return [Blockly.Arduino.quote_(a.getFieldValue('TEXT')), Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.operator_random = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'FROM', Blockly.Arduino.ORDER_HIGH) || '0';
    a = Blockly.Arduino.valueToCode(a, 'TO', Blockly.Arduino.ORDER_HIGH) || '0';
    return [`random(${b},${a}+1)`, Blockly.Arduino.ORDER_HIGH];
};
Blockly.Arduino.operator_compare = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'OPERAND1', Blockly.Arduino.ORDER_HIGH) || '0';
    const c = Blockly.Arduino.valueToCode(a, 'OPERAND2', Blockly.Arduino.ORDER_HIGH) || '0';
    return [b + {
        operator_gt: '>',
        operator_equals: '==',
        operator_lt: '<'
    }[a.type] + c, Blockly.Arduino.ORDER_RELATIONAL];
};
Blockly.Arduino.operator_arithmetic = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'NUM1', Blockly.Arduino.ORDER_HIGH) || '0';
    const c = Blockly.Arduino.valueToCode(a, 'NUM2', Blockly.Arduino.ORDER_HIGH) || '0';
    let d = Blockly.Arduino.ORDER_ADDITIVE;
    a.type !== 'operator_multiply' && a.type !== 'operator_divide' || --d;
    return [b + {
        operator_add: '+',
        operator_subtract: '-',
        operator_multiply: '*',
        operator_divide: '/'
    }[a.type] + c, d];
};
Blockly.Arduino.operator_and = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'OPERAND1', Blockly.Arduino.ORDER_HIGH) || '0';
    const c = Blockly.Arduino.valueToCode(a, 'OPERAND2', Blockly.Arduino.ORDER_HIGH) || '0';
    return [`${b}&&${c}`, Blockly.Arduino.ORDER_AND];
};
Blockly.Arduino.operator_or = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'OPERAND1', Blockly.Arduino.ORDER_HIGH) || '0';
    const c = Blockly.Arduino.valueToCode(a, 'OPERAND2', Blockly.Arduino.ORDER_HIGH) || '0';
    return [`${b}||${c}`, Blockly.Arduino.ORDER_OR];
};
Blockly.Arduino.operator_not = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'OPERAND', Blockly.Arduino.ORDER_HIGH) || '0';
    return [`!${b}`];
};
Blockly.Arduino.operator_join = function (a) {
    const blockstr = a.toString();
    const b = Blockly.Arduino.valueToCode(a, 'STRING1', Blockly.Arduino.ORDER_HIGH) || '0';
    const c = Blockly.Arduino.valueToCode(a, 'STRING2', Blockly.Arduino.ORDER_HIGH) || '0';
    if (blockstr.indexOf('?') === -1) {
        const str1Type = a.childBlocks_[0].category_;
        const str2Type = a.childBlocks_[1].category_;
        let str1MethodBoo = false;
        let str2MethodBoo = false;
        if (typeof str1Type !== 'undefined' && str1Type) {
            str1MethodBoo = true;
        }
        if (typeof str2Type !== 'undefined' && str2Type) {
            str2MethodBoo = true;
        }

        // adjust order
        const str0 = `${a.childBlocks_[0]}`;
        const str1 = `${a.childBlocks_[1]}`;

        if (b === str1 || c === str0) {
            const tmpBoo = str1MethodBoo;
            str1MethodBoo = str2MethodBoo;
            str2MethodBoo = tmpBoo;
        }

        if (str1MethodBoo && !str2MethodBoo) {
            return [`String(${b}) + String("${c}")`, Blockly.Arduino.ORDER_HIGH];
        } else if (!str1MethodBoo && str2MethodBoo) {
            return [`String("${b}") + String(${c})`, Blockly.Arduino.ORDER_HIGH];
        } else if (str1MethodBoo && str2MethodBoo) {
            return [`String(${b}) + String(${c})`, Blockly.Arduino.ORDER_HIGH];
        } else if (!str1MethodBoo && !str2MethodBoo) {
            return [`String("${b}") + String("${c}")`, Blockly.Arduino.ORDER_HIGH];
        }
    }

    return [`String("${b}") + String("${c}")`, Blockly.Arduino.ORDER_HIGH];
};
Blockly.Arduino.operator_letter_of = function (a) {
    const blockstr = a.toString();
    const b = Blockly.Arduino.valueToCode(a, 'LETTER', Blockly.Arduino.ORDER_HIGH) || '0';
    const c = Blockly.Arduino.valueToCode(a, 'STRING', Blockly.Arduino.ORDER_HIGH) || '0';

    if (blockstr.indexOf('?') === -1) {
        const str2Type = a.childBlocks_[1].category_;
        let str2MethodBoo = false;
        if (typeof str2Type !== 'undefined' && str2Type) {
            str2MethodBoo = true;
        }

        if (str2MethodBoo) {
            return [`String(String(${c}).charAt(${b}-1))`, Blockly.Arduino.ORDER_HIGH];
        }
    }

    return [`String(String("${c}").charAt(${b}-1))`, Blockly.Arduino.ORDER_HIGH];
};
Blockly.Arduino.operator_length = function (a) {
    const blockstr = a.toString();
    const b = Blockly.Arduino.valueToCode(a, 'STRING', Blockly.Arduino.ORDER_HIGH) || '0';

    if (blockstr.indexOf('?') === -1) {
        const str1Type = a.childBlocks_[0].category_;
        let str1MethodBoo = false;
        if (typeof str1Type !== 'undefined' && str1Type) {
            str1MethodBoo = true;
        }

        if (str1MethodBoo) {
            return [`String(${b}).length()`, Blockly.Arduino.ORDER_HIGH];
        }
    }

    return [`String("${b}").length()`, Blockly.Arduino.ORDER_HIGH];
};
Blockly.Arduino.operator_contains = function (a) {
    const blockstr = `${a}`;
    const b = Blockly.Arduino.valueToCode(a, 'STRING1', Blockly.Arduino.ORDER_HIGH) || '0';
    const c = Blockly.Arduino.valueToCode(a, 'STRING2', Blockly.Arduino.ORDER_HIGH) || '0';

    if (blockstr !== '? 包含 ? ?' && blockstr !== '? contains ? ?') {
        const str1Type = a.childBlocks_[0].category_;
        const str2Type = a.childBlocks_[1].category_;
        let str1MethodBoo = false;
        let str2MethodBoo = false;
        if (typeof str1Type !== 'undefined' && str1Type) {
            str1MethodBoo = true;
        }
        if (typeof str2Type !== 'undefined' && str2Type) {
            str2MethodBoo = true;
        }

        // adjust order
        const str0 = `${a.childBlocks_[0]}`;
        const str1 = `${a.childBlocks_[1]}`;

        if (b === str1 || c === str0) {
            const tmpBoo = str1MethodBoo;
            str1MethodBoo = str2MethodBoo;
            str2MethodBoo = tmpBoo;
        }

        if (str1MethodBoo && !str2MethodBoo) {
            return [`(String(${b}).indexOf(String("${c}")) != -1)`, Blockly.Arduino.ORDER_HIGH];
        } else if (!str1MethodBoo && str2MethodBoo) {
            return [`(String("${b}").indexOf(String(${c})) != -1)`, Blockly.Arduino.ORDER_HIGH];
        } else if (str1MethodBoo && str2MethodBoo) {
            return [`(String(${b}).indexOf(String(${c})) != -1)`, Blockly.Arduino.ORDER_HIGH];
        } else if (!str1MethodBoo && !str2MethodBoo) {
            return [`(String("${b}").indexOf(String("${c}")) != -1)`, Blockly.Arduino.ORDER_HIGH];
        }
    }

    return [`(String("${b}").indexOf(String("${c}")) != -1)`, Blockly.Arduino.ORDER_HIGH];
};
Blockly.Arduino.operator_mod = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'NUM1', Blockly.Arduino.ORDER_HIGH) || '0';
    const c = Blockly.Arduino.valueToCode(a, 'NUM2', Blockly.Arduino.ORDER_HIGH) || '0';
    return [`(((int)${b})%((int)${c}))`, Blockly.Arduino.ORDER_HIGH];
};
Blockly.Arduino.operator_round = function (a) {
    const b = Blockly.Arduino.valueToCode(a, 'NUM', Blockly.Arduino.ORDER_HIGH) || '0';
    return [`round(${b})`, Blockly.Arduino.ORDER_HIGH];
};
// TODO : add by Huang Weiwang huwewa@gmail.com 2019.08.08
Blockly.Arduino.operator_mathop = function (a) {
    const operator = a.getFieldValue();
    const b = Blockly.Arduino.valueToCode(a, 'NUM', Blockly.Arduino.ORDER_HIGH) || '0';
    if (operator.indexOf('绝对值') !== -1) {
        return [`(abs(${b}))`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('向下取整') !== -1) {
        return [`(floor(${b}))`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('向上取整') !== -1) {
        return [`(ceil(${b}))`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('平方根') !== -1) {
        return [`(sqrt(${b}))`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('sin') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('cos') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('tan') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('asin') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('acos') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('atan') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('ln') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('log') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('e^') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    } else if (operator.indexOf('10^') !== -1) {
        return [`abs(${b})`, Blockly.Arduino.ORDER_HIGH];
    }
    return [``, Blockly.Arduino.ORDER_HIGH];
};
Blockly.Arduino.data_setvariableto = function (block) {
    const blockstr = block.toString();
    if (blockstr.indexOf('?') === -1) {
        const argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE);
        const varName = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE);
        Blockly.Arduino.definitions_[`define_variable${varName}`] = `double ${varName} = 0;`;
        if (typeof argument0 !== 'undefined' && argument0) {
            // argument0 is defind and not null
            return `${varName} = ${argument0};\n`;
        }
        return `${varName} = 0;\n`;
    }
    return `${Blockly.Arduino.INDENT}  = 0;\n`;

};
Blockly.Arduino.data_changevariableby = function (block) {
    const blockstr = block.toString();
    if (blockstr.indexOf('?') === -1) {
        const argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE);
        const varName = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE);
        Blockly.Arduino.definitions_[`define_variable${varName}`] = `double ${varName} = 0;`;
        if (typeof argument0 !== 'undefined' && argument0) {
            // argument0 is defind and not null
            return `${Blockly.Arduino.INDENT + varName} = ${varName} + ${argument0};\n`;
        }
        return `${Blockly.Arduino.INDENT + varName} = ${varName} + 1;\n`;
    }
    return `${Blockly.Arduino.INDENT}  = 0;\n`;

};
Blockly.Arduino.data_variable = function (block) {
    const code = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE);
    Blockly.Arduino.definitions_[`define_variable${code}`] = `double ${code} = 0;`;
    return [code, Blockly.Arduino.ORDER_NONE];
};
Blockly.Arduino.arduino_variable_create = function (a) {
    const b = Blockly.Arduino.ORDER_ATOMIC; const type = Blockly.Arduino.valueToCode(a, 'TYPE', b);
    const name = Blockly.Arduino.valueToCode(a, 'NAME', b); const value = Blockly.Arduino.valueToCode(a, 'VALUE', b);
    Blockly.Arduino.definitions_[`define_variable${name}`] = `${type} ${name} = ${value};`;
    return '';
};
Blockly.Arduino.sensor_ultrasonicDistance = function (a) {
    const PIN = Blockly.Arduino.valueToCode(a, 'PORT', Blockly.Arduino.ORDER_ATOMIC);
    Blockly.Arduino.includes_.ultra = '#include <Wire.h>';
    Blockly.Arduino.setups_.setup_ultrasonic = `pinMode(${PIN},OUTPUT);\n`;
    Blockly.Arduino.definitions_.define_getDistance = `${'float getDistance()\n' +
        '{\n' +
        '  digitalWrite('}${PIN}, LOW); \n` +
        `  delayMicroseconds(2);       \n` +
        `  digitalWrite(${PIN}, HIGH); \n` +
        `  delayMicroseconds(10); \n` +
        `  digitalWrite(${PIN}, LOW); \n` +
        `  float cm = pulseIn(${PIN}, HIGH) / 58.0;  \n` +
        `  cm = (int(cm * 100.0)) / 100.0;\n` +
        `  return cm;\n` +
        `}\n`;
    return ['getDistance()', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_ultrasonicDistance2W = function (a) {
    const trig_pin = Blockly.Arduino.valueToCode(a, 'TRIG', Blockly.Arduino.ORDER_ATOMIC);
    const echo_pin = Blockly.Arduino.valueToCode(a, 'ECHO', Blockly.Arduino.ORDER_ATOMIC);
    Blockly.Arduino.includes_.ultra = '#include <Wire.h>';
    Blockly.Arduino.setups_.setup_ultrasonic_out = `pinMode(${trig_pin},OUTPUT);`;
    Blockly.Arduino.setups_.setup_ultrasonic_in = `pinMode(${echo_pin},INPUT);`;
    Blockly.Arduino.definitions_.define_getDistance = `${'float getDistance()\n' +
        '{\n' +
        '  digitalWrite('}${trig_pin}, LOW); \n` +
        `  delayMicroseconds(5);      \n` +
        `  digitalWrite(${trig_pin}, HIGH); \n` +
        `  delayMicroseconds(10); \n` +
        `  digitalWrite(${trig_pin}, LOW); \n` +
        `  float cm = pulseIn(${echo_pin}, HIGH) / 58.2;  \n` +
        `  cm = (int(cm * 100.0)) / 100.0;\n` +
        `  return cm;\n` +
        `}\n`;
    return ['getDistance()', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_dht11 = function (a) {
    const pin = Blockly.Arduino.valueToCode(a, 'PIN', Blockly.Arduino.ORDER_ATOMIC);
    const type = Blockly.Arduino.valueToCode(a, 'TYPE', Blockly.Arduino.ORDER_ATOMIC);
    Blockly.Arduino.includes_.ultra = `#include <DHT.h>\nDHT dht11(${pin}, DHT11);\n`;
    Blockly.Arduino.setups_.setup_dht11 = 'dht11.begin();\n';
    if (type === 'temperature') {
        return ['dht11.readTemperature()', Blockly.Arduino.ORDER_ATOMIC];
    }
    return ['dht11.readHumidity()', Blockly.Arduino.ORDER_ATOMIC];

};
Blockly.Arduino.sensor_sharp_ir = function (a) {
    const pin = Blockly.Arduino.valueToCode(a, 'PIN', Blockly.Arduino.ORDER_ATOMIC);
    Blockly.Arduino.definitions_.define_getDistance = `${'int getGp2d12mm()\n' +
        '{\n' +
        '  int value = analogRead('}${pin}); \n` +
        `  return (6787.0 / (value - 3.0)) - 4.0;\n` +
        `}\n`;
    return ['getGp2d12mm()', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_DS1302_setup = function (a) {
    const clkPin = Blockly.Arduino.valueToCode(a, 'CLK', Blockly.Arduino.ORDER_ATOMIC);
    const datPin = Blockly.Arduino.valueToCode(a, 'DAT', Blockly.Arduino.ORDER_ATOMIC);
    const rstPin = Blockly.Arduino.valueToCode(a, 'RST', Blockly.Arduino.ORDER_ATOMIC);
    Blockly.Arduino.includes_.ds1302 = `#include <stdio.h>\n#include <DS1302.h>`;
    Blockly.Arduino.definitions_.define_namespace = `namespace {\n${Blockly.Arduino.INDENT}${'const int clkPin = '}${clkPin};\n` +
        `${Blockly.Arduino.INDENT}${'const int datPin = '}${datPin};\n${Blockly.Arduino.INDENT}${'const int rstPin = '}${rstPin};\n` +
        `${Blockly.Arduino.INDENT}${'DS1302 rtc(rstPin, datPin, clkPin);'}\n\n` +
        `${Blockly.Arduino.INDENT}String dayAsString(const Time::Day day) {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}switch (day) {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case Time::kSunday: return "Sunday";\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case Time::kMonday: return "Monday";\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case Time::kTuesday: return "Tuesday";\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case Time::kWednesday: return "Wednesday";\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case Time::kThursday: return "Thursday";\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case Time::kFriday: return "Friday";\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case Time::kSaturday: return "Saturday";\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return "unknown day";\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}String getDay() {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}Time t = rtc.time();\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return dayAsString(t.day);\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}int getYear() {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}Time t = rtc.time();\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return t.yr;\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}int getMonth() {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}Time t = rtc.time();\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return t.mon;\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}int getDate() {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}Time t = rtc.time();\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return t.date;\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}int getHour() {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}Time t = rtc.time();\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return t.hr;\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}int getMinute() {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}Time t = rtc.time();\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return t.min;\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}int getSecond() {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}Time t = rtc.time();\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return t.sec;\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}Time::Day calWeekDay(int y, int m, int d) {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}int day = (d += m < 4 ? y-- : y - 2, 23*m/9 + d + 4 + y/4- y/100 + y/400)%7;\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}switch (day) {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case 7: return Time::kSunday;\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case 1: return Time::kMonday;\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case 2: return Time::kTuesday;\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case 3: return Time::kWednesday;\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case 4: return Time::kThursday;\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case 5: return Time::kFriday;\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}case 6: return Time::kSaturday;\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}return Time::kSunday;\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `}\n`;
    return '';
};
Blockly.Arduino.sensor_DS1302 = function (a) {
    const y = Blockly.Arduino.valueToCode(a, 'YEAR', Blockly.Arduino.ORDER_ATOMIC);
    const m = Blockly.Arduino.valueToCode(a, 'MONTH', Blockly.Arduino.ORDER_ATOMIC);
    const d = Blockly.Arduino.valueToCode(a, 'DATE', Blockly.Arduino.ORDER_ATOMIC);
    const h = Blockly.Arduino.valueToCode(a, 'HOUR', Blockly.Arduino.ORDER_ATOMIC);
    const min = Blockly.Arduino.valueToCode(a, 'MINUTE', Blockly.Arduino.ORDER_ATOMIC);
    const s = Blockly.Arduino.valueToCode(a, 'SECOND', Blockly.Arduino.ORDER_ATOMIC);
    Blockly.Arduino.setups_.setup_ds1302 = `rtc.writeProtect(false);\n` +
        `rtc.halt(false);\n` +
        `Time t(${y},${m},${d},${h},${min},${s},calWeekDay(${y},${m},${d}));\n` +
        `rtc.time(t);`;

    return '';
};
Blockly.Arduino.sensor_getDS1302 = function (a) {
    const type = Blockly.Arduino.valueToCode(a, 'TYPE', Blockly.Arduino.ORDER_ATOMIC);
    if (type === 'year') {
        return ['getYear()', Blockly.Arduino.ORDER_ATOMIC];
    } else if (type === 'month') {
        return ['getMonth()', Blockly.Arduino.ORDER_ATOMIC];
    } else if (type === 'date') {
        return ['getDate()', Blockly.Arduino.ORDER_ATOMIC];
    } else if (type === 'hour') {
        return ['getHour()', Blockly.Arduino.ORDER_ATOMIC];
    } else if (type === 'minute') {
        return ['getMinute()', Blockly.Arduino.ORDER_ATOMIC];
    } else if (type === 'second') {
        return ['getSecond()', Blockly.Arduino.ORDER_ATOMIC];
    } else if (type === 'day') {
        return ['getDay()', Blockly.Arduino.ORDER_ATOMIC];
    }
    return ['', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_infraredTrack = function (a) {
    const b = Blockly.Arduino.ORDER_NONE; const mode = Blockly.Arduino.valueToCode(a, 'MODE', b);
    const PORT = Blockly.Arduino.valueToCode(a, 'PORT', b);
    Blockly.Arduino.setups_.setup_irTrack = `pinMode(${PORT}, INPUT);\n`;
    Blockly.Arduino.definitions_.define_irTrack = `${'String ir_track()\n' +
        '{\n' +
        ' int data = '}${mode}Read(${PORT}); \n` +
        ` return String(data); \n` +
        `}\n`;
    return ['ir_track()', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_temperature = function (a) {
    const PIN = Blockly.Arduino.valueToCode(a, 'PORT', Blockly.Arduino.ORDER_ATOMIC);
    Blockly.Arduino.includes_.temp = '#include <math.h>';
    Blockly.Arduino.definitions_.define_temperature = `${'String temperature()\n' +
        '{\n' +
        ' int a = analogRead('}${PIN}); \n` +
        ` float R = 1023.0/a-1.0; \n` +
        ` R = 100000*R; \n` +
        ` float temperature = 1.0/(log(R/100000)/4275+1/298.15)-273.15; \n` +
        ` return String(temperature,2) + String('C'); \n` +
        `}\n`;
    return ['temperature()', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_humidity = function (a) {
    const PIN = Blockly.Arduino.valueToCode(a, 'PORT', Blockly.Arduino.ORDER_ATOMIC);
    Blockly.Arduino.includes_.humid = '#include <DHT.h>';
    Blockly.Arduino.variables_.var_dht = `DHT dht(${PIN}, DHT11);\n`;
    Blockly.Arduino.setups_.setup_humid = 'dht.begin();\n';
    Blockly.Arduino.definitions_.define_humidity = 'String humidity()\n' +
        '{\n' +
        ' float h = dht.readHumidity(); \n' +
        " return String(h,2) + String('%'); \n" +
        '}\n';
    return ['humidity()', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_bmp180 = function (a) {

    const data = Blockly.Arduino.valueToCode(a, 'DATA', Blockly.Arduino.ORDER_ATOMIC);
    const oss = Blockly.Arduino.valueToCode(a, 'OSS', Blockly.Arduino.ORDER_ATOMIC);
    console.log(`BMP Data: ${data}`);
    console.log(`BMP OSS: ${oss}`);
    Blockly.Arduino.includes_.wire = '#include <Wire.h>';
    Blockly.Arduino.variables_.var_bmp180 = '#define BMP180ADD 0xEE>>1;\n' + 'unsigned char OSS;\n' + 'int ac1, ac2, ac3;\n' +
        'unsigned int ac4, ac5, ac6;\n' + 'int b1, b2;\n' + 'int mb, mc, md;\n' + 'float temperature;\n' + 'double pressure, pressure2, altitude;\n' + 'long b5;\n';
    Blockly.Arduino.setups_.setup_bmp180 = `${'Wire.begin();\n' + 'OSS = '}${oss};\n` + `BMP180start();\n`;
    Blockly.Arduino.definitions_.define_bmp180 = 'String calculate(int index)\n' +
        '{\n' +
        ' temperature = bmp180GetTemperature(bmp180ReadUT());\n' +
        ' temperature = temperature*0.1;\n' +
        ' pressure = bmp180GetPressure(bmp180ReadUP());\n' +
        ' pressure2 = pressure/101325;\n' +
        ' pressure2 = pow(pressure2,0.19029496);\n' +
        ' altitude = 44330*(1-pressure2);\n' +
        ' char *myStrings[] = {String(temperature,1),String(pressure),String(altitude)};\n' +
        ' return myStrings[index];\n' +
        '}\n' +
        'void BMP180start()\n' +
        '{\n' +
        ' ac1 = bmp180ReadDate(0xAA);\n' +
        ' ac2 = bmp180ReadDate(0xAC);\n' +
        ' ac3 = bmp180ReadDate(0xAE);\n' +
        ' ac4 = bmp180ReadDate(0xB0);\n' +
        ' ac5 = bmp180ReadDate(0xB2);\n' +
        ' ac6 = bmp180ReadDate(0xB4);\n' +
        ' b1 = bmp180ReadDate(0xB6);\n' +
        ' b2 = bmp180ReadDate(0xB8);\n' +
        ' mb = bmp180ReadDate(0xBA);\n' +
        ' mc = bmp180ReadDate(0xBC);\n' +
        ' md = bmp180ReadDate(0xBE);\n' +
        '}\n' +
        'short bmp180GetTemperature(unsigned int ut)\n' +
        '{\n' +
        ' long x1, x2;\n' +
        ' x1 = (((long)ut - (long)ac6)*(long)ac5) >> 15;\n' +
        ' x2 = ((long)mc << 11)/(x1 + md);\n' +
        ' b5 = x1 + x2;\n' +
        ' return ((b5 + 8)>>4);\n' +
        '}\n' +
        'long bmp180GetPressure(unsigned long up)\n' +
        '{\n' +
        ' long x1, x2, x3, b3, b6, p;\n' +
        ' unsigned long b4, b7;\n' +
        ' b6 = b5 - 4000;\n' +
        ' x1 = (b2 * (b6 * b6)>>12)>>11;\n' +
        ' x2 = (ac2 * b6)>>11;\n' +
        ' x3 = x1 + x2;\n' +
        '\n' +
        ' b3 = (((((long)ac1)*4 + x3)<<OSS) + 2)>>2;\n' +
        ' x1 = (ac3 * b6)>>13;\n' +
        ' x2 = (b1 * ((b6 * b6)>>12))>>16;\n' +
        ' x3 = ((x1 + x2) + 2)>>2;\n' +
        ' b4 = (ac4 * (unsigned long)(x3 + 32768))>>15;\n' +
        ' b7 = ((unsigned long)(up - b3) * (50000>>OSS));\n' +
        ' if (b7 < 0x80000000)\n' +
        '   p = (b7<<1)/b4;\n' +
        ' else\n' +
        '   p = (b7/b4)<<1;\n' +
        '\n' +
        ' x1 = (p>>8) * (p>>8);\n' +
        ' x1 = (x1 * 3038)>>16;\n' +
        ' x2 = (-7357 * p)>>16;\n' +
        ' p += (x1 + x2 + 3791)>>4;\n' +
        '\n' +
        ' return p;\n' +
        '}\n' +
        'int bmp180Read(unsigned char address)\n' +
        '{\n' +
        ' unsigned char data;\n' +
        ' Wire.beginTransmission(BMP180ADD);\n' +
        ' Wire.write(address);\n' +
        ' Wire.endTransmission();\n' +
        ' Wire.requestFrom(BMP180ADD, 1);\n' +
        ' while(!Wire.available());\n' +
        ' return Wire.read();\n' +
        '}\n' +
        'int bmp180ReadDate(unsigned char address)\n' +
        '{\n' +
        ' unsigned char msb, lsb;\n' +
        ' Wire.beginTransmission(BMP180ADD);\n' +
        ' Wire.write(address);\n' +
        ' Wire.endTransmission();\n' +
        ' Wire.requestFrom(BMP180ADD, 2);\n' +
        ' while(Wire.available()<2);\n' +
        ' msb = Wire.read();\n' +
        ' lsb = Wire.read();\n' +
        ' return (int) msb<<8 | lsb;\n' +
        '}\n' +
        'unsigned int bmp180ReadUT()' +
        '{\n' +
        ' unsigned int ut;\n' +
        ' Wire.beginTransmission(BMP180ADD);\n' +
        ' Wire.write(0xF4);\n' +
        ' Wire.write(0x2E);\n' +
        ' Wire.endTransmission();\n' +
        ' delay(5);\n' +
        ' ut = bmp180ReadDate(0xF6);\n' +
        ' return ut;\n' +
        '}\n' +
        'unsigned long bmp180ReadUP()' +
        '{\n' +
        ' unsigned char msb, lsb, xlsb;\n' +
        ' unsigned long up = 0;\n' +
        ' Wire.beginTransmission(BMP180ADD);\n' +
        ' Wire.write(0xF4);\n' +
        ' Wire.write(0x34 + (OSS<<6));\n' +
        ' Wire.endTransmission();\n' +
        ' delay(2 + (3<<OSS));\n' +
        ' Wire.beginTransmission(BMP180ADD);\n' +
        ' Wire.write(0xF6);\n' +
        ' Wire.endTransmission();\n' +
        ' Wire.requestFrom(BMP180ADD, 3);\n' +
        ' while(Wire.available() < 3);\n' +
        ' msb = Wire.read();\n' +
        ' lsb = Wire.read();\n' +
        ' xlsb = Wire.read();\n' +
        ' up = (((unsigned long) msb << 16) | ((unsigned long) lsb << 8) | (unsigned long) xlsb) >> (8-OSS);\n' +
        ' return up;\n' +
        '}\n';
    return [`calculate(${data})`, Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_lcdAddress = function (a) {
    const address = Blockly.Arduino.valueToCode(a, 'VALUE', Blockly.Arduino.ORDER_NONE);
    Blockly.Arduino.variables_.var_lcd = `LiquidCrystal_I2C lcd(${address},16,2);\n`;
    return '';
};
Blockly.Arduino.display_lcdDisplay = function (a) {
    let row = Blockly.Arduino.valueToCode(a, 'ROW', Blockly.Arduino.ORDER_NONE);
    if (row === '2') {
        row = '1';
    } else row = '0';
    const value = Blockly.Arduino.valueToCode(a, 'VALUE', Blockly.Arduino.ORDER_ATOMIC).indexOf('(') > -1 ? Blockly.Arduino.valueToCode(a, 'VALUE', Blockly.Arduino.ORDER_NONE) : `"${Blockly.Arduino.valueToCode(a, 'VALUE', Blockly.Arduino.ORDER_NONE)}"`;
    Blockly.Arduino.includes_.lcd = '#include <LiquidCrystal_I2C.h>';
    Blockly.Arduino.setups_.setup_lcd = 'lcd.begin();\nlcd.backlight();\n';
    Blockly.Arduino.definitions_.define_lcd = 'void displayLCD(String disvalue, int row)\n' +
        '{\n' +
        '  char buff[17] = {0};\n' +
        '  const char* to_print = disvalue.c_str();\n' +
        '  sprintf(buff, "%-16s", to_print);\n' +
        '  lcd.setCursor(0,row);\n' +
        '  lcd.print(buff);\n' +
        '}\n' +
        'void displayLCD(double value, int row)\n{\n' +
        '  String disvalue = String(value, 2);\n' +
        '  char buff[17] = {0};\n' +
        '  const char* to_print = disvalue.c_str();\n' +
        '  sprintf(buff, "%-16s", to_print);\n' +
        '  lcd.setCursor(0,row);\n' +
        '  lcd.print(buff);\n' +
        '}\n' +
        'void displayLCD(float value, int row)\n{\n' +
        '  String disvalue = String(value, 2);\n' +
        '  char buff[17] = {0};\n' +
        '  const char* to_print = disvalue.c_str();\n' +
        '  sprintf(buff, "%-16s", to_print);\n' +
        '  lcd.setCursor(0,row);\n' +
        '  lcd.print(buff);\n' +
        '}\n' +
        'void displayLCD(long value, int row)\n{\n' +
        '  String disvalue = String(value);\n' +
        '  char buff[17] = {0};\n' +
        '  const char* to_print = disvalue.c_str();\n' +
        '  sprintf(buff, "%-16s", to_print);\n' +
        '  lcd.setCursor(0,row);\n' +
        '  lcd.print(buff);\n' +
        '}\n' +
        'void displayLCD(int value, int row)\n{\n' +
        '  String disvalue = String(value);\n' +
        '  char buff[17] = {0};\n' +
        '  const char* to_print = disvalue.c_str();\n' +
        '  sprintf(buff, "%-16s", to_print);\n' +
        '  lcd.setCursor(0,row);\n' +
        '  lcd.print(buff);\n' +
        '}\n' +
        'void displayLCD(unsigned int value, int row)\n{\n' +
        '  String disvalue = String(value);\n' +
        '  char buff[17] = {0};\n' +
        '  const char* to_print = disvalue.c_str();\n' +
        '  sprintf(buff, "%-16s", to_print);\n' +
        '  lcd.setCursor(0,row);\n' +
        '  lcd.print(buff);\n' +
        '}\n';

    return `   displayLCD(${value},${row});\n`;
};
Blockly.Arduino.sensor_button = function (a) {
    const b = Blockly.Arduino.ORDER_NONE;
    return [`!digitalRead(${Blockly.Arduino.valueToCode(a, 'PIN', b)})`, b];
};
Blockly.Arduino.arduino_systemUptime = function (a) {
    return ['millis()', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.display_initOneBitSegment = function (a) {
    const pinA = Blockly.Arduino.valueToCode(a, 'PIN_A', Blockly.Arduino.ORDER_NONE);
    const pinB = Blockly.Arduino.valueToCode(a, 'LATCH_PIN', Blockly.Arduino.ORDER_NONE);
    const pinC = Blockly.Arduino.valueToCode(a, 'PIN_C', Blockly.Arduino.ORDER_NONE);
    const pinD = Blockly.Arduino.valueToCode(a, 'PIN_D', Blockly.Arduino.ORDER_NONE);
    const pinE = Blockly.Arduino.valueToCode(a, 'PIN_E', Blockly.Arduino.ORDER_NONE);
    const pinF = Blockly.Arduino.valueToCode(a, 'PIN_F', Blockly.Arduino.ORDER_NONE);
    const pinG = Blockly.Arduino.valueToCode(a, 'PIN_G', Blockly.Arduino.ORDER_NONE);
    const pinDP = Blockly.Arduino.valueToCode(a, 'PIN_DP', Blockly.Arduino.ORDER_NONE);
    const pinCOM = Blockly.Arduino.valueToCode(a, 'PIN_COM', Blockly.Arduino.ORDER_NONE);
    const comType = Blockly.Arduino.valueToCode(a, 'COM_TYPE', Blockly.Arduino.ORDER_NONE);
    Blockly.Arduino.variables_.var_pinA = `const int A_PIN = ${pinA};`;
    Blockly.Arduino.variables_.var_pinB = `const int B_PIN = ${pinB};`;
    Blockly.Arduino.variables_.var_pinC = `const int C_PIN = ${pinC};`;
    Blockly.Arduino.variables_.var_pinD = `const int D_PIN = ${pinD};`;
    Blockly.Arduino.variables_.var_pinE = `const int E_PIN = ${pinE};`;
    Blockly.Arduino.variables_.var_pinF = `const int F_PIN = ${pinF};`;
    Blockly.Arduino.variables_.var_pinG = `const int G_PIN = ${pinG};`;
    Blockly.Arduino.variables_.var_pinDP = `const int DP_PIN = ${pinDP};`;
    Blockly.Arduino.variables_.var_pinCOM = `const int COM_PIN = ${pinCOM};`;
    Blockly.Arduino.variables_.var_comType = `const int COM_TYPE = ${comType};`;

    Blockly.Arduino.setups_.setup_pinA = `pinMode(A_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinB = `pinMode(B_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinC = `pinMode(C_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinD = `pinMode(D_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinE = `pinMode(E_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinF = `pinMode(F_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinG = `pinMode(G_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinDP = `pinMode(DP_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinCOM = `pinMode(COM_PIN, OUTPUT);`;

    return '';
};
Blockly.Arduino.display_initTwoBitSegment = function (a) {
    const pinA = Blockly.Arduino.valueToCode(a, 'PIN_A', Blockly.Arduino.ORDER_NONE);
    const pinB = Blockly.Arduino.valueToCode(a, 'LATCH_PIN', Blockly.Arduino.ORDER_NONE);
    const pinC = Blockly.Arduino.valueToCode(a, 'PIN_C', Blockly.Arduino.ORDER_NONE);
    const pinD = Blockly.Arduino.valueToCode(a, 'PIN_D', Blockly.Arduino.ORDER_NONE);
    const pinE = Blockly.Arduino.valueToCode(a, 'PIN_E', Blockly.Arduino.ORDER_NONE);
    const pinF = Blockly.Arduino.valueToCode(a, 'PIN_F', Blockly.Arduino.ORDER_NONE);
    const pinG = Blockly.Arduino.valueToCode(a, 'PIN_G', Blockly.Arduino.ORDER_NONE);
    const pinDP = Blockly.Arduino.valueToCode(a, 'PIN_DP', Blockly.Arduino.ORDER_NONE);
    const pinCOM1 = Blockly.Arduino.valueToCode(a, 'PIN_COM1', Blockly.Arduino.ORDER_NONE);
    const pinCOM2 = Blockly.Arduino.valueToCode(a, 'PIN_COM2', Blockly.Arduino.ORDER_NONE);
    Blockly.Arduino.variables_.var_pinA = `const int A_PIN = ${pinA};`;
    Blockly.Arduino.variables_.var_pinB = `const int B_PIN = ${pinB};`;
    Blockly.Arduino.variables_.var_pinC = `const int C_PIN = ${pinC};`;
    Blockly.Arduino.variables_.var_pinD = `const int D_PIN = ${pinD};`;
    Blockly.Arduino.variables_.var_pinE = `const int E_PIN = ${pinE};`;
    Blockly.Arduino.variables_.var_pinF = `const int F_PIN = ${pinF};`;
    Blockly.Arduino.variables_.var_pinG = `const int G_PIN = ${pinG};`;
    Blockly.Arduino.variables_.var_pinDP = `const int DP_PIN = ${pinDP};`;
    Blockly.Arduino.variables_.var_pinCOM1 = `const int COM1_PIN = ${pinCOM1};`;
    Blockly.Arduino.variables_.var_pinCOM2 = `const int COM2_PIN = ${pinCOM2};`;
    Blockly.Arduino.variables_.var_comType = `const int COM_TYPE = 0;`;

    Blockly.Arduino.setups_.setup_pinA = `pinMode(A_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinB = `pinMode(B_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinC = `pinMode(C_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinD = `pinMode(D_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinE = `pinMode(E_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinF = `pinMode(F_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinG = `pinMode(G_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinDP = `pinMode(DP_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinCOM1 = `pinMode(COM1_PIN, OUTPUT);`;
    Blockly.Arduino.setups_.setup_pinCOM2 = `pinMode(COM2_PIN, OUTPUT);`;

    return '';
};
Blockly.Arduino.display_oneBitSegment = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const pin = Blockly.Arduino.valueToCode(a, 'PIN', Blockly.Arduino.ORDER_ATOMIC);
        const value = Blockly.Arduino.valueToCode(a, 'VALUE', Blockly.Arduino.ORDER_ATOMIC);
        return `digitalWrite(${pin}_PIN,${value})${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.display_twoBitSegment = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const pin = Blockly.Arduino.valueToCode(a, 'PIN', Blockly.Arduino.ORDER_ATOMIC);
        const value = Blockly.Arduino.valueToCode(a, 'VALUE', Blockly.Arduino.ORDER_ATOMIC);
        return `digitalWrite(${pin}_PIN,${value})${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.display_segmentDisplay = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        Blockly.Arduino.definitions_.define_variable_segment = '//根据共阴极数码管段码表定义0~9显示的各段开关状态\n' +
            `const int numTable[10][7] = {\n` +
            `${Blockly.Arduino.INDENT}//1为点亮，0为关闭\n` +
            `${Blockly.Arduino.INDENT}//a  b  c  d  e  f  g \n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 1, 1, 1, 0},//0\n` +
            `${Blockly.Arduino.INDENT}{0, 1, 1, 0, 0, 0, 0},//1\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 0, 1, 1, 0, 1},//2\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 1, 0, 0, 1},//3\n` +
            `${Blockly.Arduino.INDENT}{0, 1, 1, 0, 0, 1, 1},//4\n` +
            `${Blockly.Arduino.INDENT}{1, 0, 1, 1, 0, 1, 1},//5\n` +
            `${Blockly.Arduino.INDENT}{1, 0, 1, 1, 1, 1, 1},//6\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 0, 0, 0, 0},//7\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 1, 1, 1, 1},//8\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 1, 0, 1, 1},//9\n` +
            '};\n';

        Blockly.Arduino.definitions_.define_showNum = 'void showNum(int num, int comType) {\n' +
            `${Blockly.Arduino.INDENT}digitalWrite(A_PIN, comType ^ numTable[num][0]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(B_PIN, comType ^ numTable[num][1]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(C_PIN, comType ^ numTable[num][2]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(D_PIN, comType ^ numTable[num][3]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(E_PIN, comType ^ numTable[num][4]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(F_PIN, comType ^ numTable[num][5]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(G_PIN, comType ^ numTable[num][6]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(COM_PIN, comType);\n` +
            '}\n';


        const num = Blockly.Arduino.valueToCode(a, 'NUM', Blockly.Arduino.ORDER_ATOMIC);
        return `showNum(${num}, COM_TYPE)${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.display_segmentDisplayTwoDigits = function (a) {
    const blockstr = a.toString();
    console.log('1');
    if (blockstr.indexOf('?') === -1) {
        console.log('2');
        Blockly.Arduino.definitions_.define_variable_segment = '//根据共阴极数码管段码表定义0~99显示的各段开关状态\n' +
            `const int numTable[10][7] = {\n` +
            `${Blockly.Arduino.INDENT}//1为点亮，0为关闭\n` +
            `${Blockly.Arduino.INDENT}//a  b  c  d  e  f  g \n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 1, 1, 1, 0},//0\n` +
            `${Blockly.Arduino.INDENT}{0, 1, 1, 0, 0, 0, 0},//1\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 0, 1, 1, 0, 1},//2\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 1, 0, 0, 1},//3\n` +
            `${Blockly.Arduino.INDENT}{0, 1, 1, 0, 0, 1, 1},//4\n` +
            `${Blockly.Arduino.INDENT}{1, 0, 1, 1, 0, 1, 1},//5\n` +
            `${Blockly.Arduino.INDENT}{1, 0, 1, 1, 1, 1, 1},//6\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 0, 0, 0, 0},//7\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 1, 1, 1, 1},//8\n` +
            `${Blockly.Arduino.INDENT}{1, 1, 1, 1, 0, 1, 1},//9\n` +
            '};\n';
        console.log('3');
        Blockly.Arduino.definitions_.define_showNum = 'void showNum(int num) {\n' +
            `${Blockly.Arduino.INDENT}digitalWrite(A_PIN, numTable[num][0]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(B_PIN, numTable[num][1]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(C_PIN, numTable[num][2]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(D_PIN, numTable[num][3]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(E_PIN, numTable[num][4]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(F_PIN, numTable[num][5]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(G_PIN, numTable[num][6]);\n` +
            '}\n';
        console.log('4');
        Blockly.Arduino.definitions_.define_displayTwoDigits = 'void showTwoDigits(int num) {\n' +
            `${Blockly.Arduino.INDENT}if (num < 10) {\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}showNum(num - int(num/10)*10);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(COM1_PIN,HIGH);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(COM2_PIN,LOW);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(DP_PIN,LOW);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}delay(0.01*1000);\n` +
            `${Blockly.Arduino.INDENT}} else {\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}showNum(int(num/10));\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(COM1_PIN,LOW);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(COM2_PIN,HIGH);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(DP_PIN,LOW);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}delay(0.01*1000);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}showNum(num - int(num/10)*10);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(COM1_PIN,HIGH);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(COM2_PIN,LOW);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(DP_PIN,LOW);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}delay(0.01*1000);\n` +
            `${Blockly.Arduino.INDENT}}\n` +
            '}\n';
        console.log('4');
        const num = Blockly.Arduino.valueToCode(a, 'NUM', Blockly.Arduino.ORDER_ATOMIC);
        console.log(`num: ${num}`);
        if (num < 0 || num > 99) {
            alert(`${e.message}. Input must be integer between 0 ~ 99.`);
            return `showTwoDigits(0)${Blockly.Arduino.END}`;
        }
        return `showTwoDigits(${num})${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.display_segmentDisplayDot = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const boolval = Blockly.Arduino.valueToCode(a, 'BOOLVAL', Blockly.Arduino.ORDER_ATOMIC);
        return `digitalWrite(DP_PIN,${boolval})${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.display_init2BitSegmentLatch = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const dataPin = Blockly.Arduino.valueToCode(a, 'DATA_PIN', Blockly.Arduino.ORDER_NONE);
        const latchPin = Blockly.Arduino.valueToCode(a, 'LATCH_PIN', Blockly.Arduino.ORDER_NONE);
        const clockPin = Blockly.Arduino.valueToCode(a, 'CLOCK_PIN', Blockly.Arduino.ORDER_NONE);
        Blockly.Arduino.definitions_.define_variable_dataPin = `const int dataPin = ${dataPin};`;
        Blockly.Arduino.definitions_.define_variable_latchPin = `const int latchPin = ${latchPin};`;
        Blockly.Arduino.definitions_.define_variable_clockPin = `const int clockPin = ${clockPin};`;
        Blockly.Arduino.definitions_.define_variable_dat = 'const byte DAT[12] = {\n' +
            `${Blockly.Arduino.INDENT}B11111100,\n` +
            `${Blockly.Arduino.INDENT}B01100000,\n` +
            `${Blockly.Arduino.INDENT}B11011010,\n` +
            `${Blockly.Arduino.INDENT}B11110010,\n` +
            `${Blockly.Arduino.INDENT}B01100110,\n` +
            `${Blockly.Arduino.INDENT}B10110110,\n` +
            `${Blockly.Arduino.INDENT}B10111110,\n` +
            `${Blockly.Arduino.INDENT}B11100000,\n` +
            `${Blockly.Arduino.INDENT}B11111110,\n` +
            `${Blockly.Arduino.INDENT}B11100110,\n` +
            `${Blockly.Arduino.INDENT}B00000001,\n` +
            `${Blockly.Arduino.INDENT}B00000000\n` +
            '};\n';
        Blockly.Arduino.setups_.setup_dataPin = `pinMode(latchPin, OUTPUT);`;
        Blockly.Arduino.setups_.setup_latchPin = `pinMode(clockPin, OUTPUT);`;
        Blockly.Arduino.setups_.setup_clockPin = `pinMode(dataPin, OUTPUT);`;

        Blockly.Arduino.definitions_.define_showNumLatch = 'void showNumLatch(int num) {\n' +
            `${Blockly.Arduino.INDENT}if (num >= 0) {\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}if (num == 0) {\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(latchPin, LOW);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}shiftOut(dataPin, clockPin, LSBFIRST, DAT[0]);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}shiftOut(dataPin, clockPin, LSBFIRST, DAT[0]);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(latchPin, HIGH);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}} else {\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(latchPin, LOW);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}shiftOut(dataPin, clockPin, LSBFIRST, DAT[num % 10]);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}shiftOut(dataPin, clockPin, LSBFIRST, DAT[num / 10]);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}digitalWrite(latchPin, HIGH);\n` +
            `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
            `${Blockly.Arduino.INDENT}}\n` +
            '}\n';

        Blockly.Arduino.definitions_.define_showNum = 'void offLatch() {\n' +
            `${Blockly.Arduino.INDENT}digitalWrite(latchPin, LOW);\n` +
            `${Blockly.Arduino.INDENT}shiftOut(dataPin, clockPin, LSBFIRST, DAT[11]);\n` +
            `${Blockly.Arduino.INDENT}shiftOut(dataPin, clockPin, LSBFIRST, DAT[11]);\n` +
            `${Blockly.Arduino.INDENT}digitalWrite(latchPin, HIGH);\n` +
            '}\n';

        return ``;
    }
    return ``;
};
Blockly.Arduino.display_segmentDisplayLatch = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const num = Blockly.Arduino.valueToCode(a, 'NUM', Blockly.Arduino.ORDER_ATOMIC);
        return `showNumLatch(${num})${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.display_reset2BitSegmentLatch = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        return `offLatch()${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.display_initTM16374DigitDisplay = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const clkPin = Blockly.Arduino.valueToCode(a, 'CLK_PIN', Blockly.Arduino.ORDER_ATOMIC);
        const dioPin = Blockly.Arduino.valueToCode(a, 'DIO_PIN', Blockly.Arduino.ORDER_ATOMIC);
        Blockly.Arduino.includes_.lcd = '#include <TM1637Display.h>';
        Blockly.Arduino.definitions_.define_variable_clkPin = `const int CLK = ${clkPin};`;
        Blockly.Arduino.definitions_.define_variable_dioPin = `const int DIO = ${dioPin};`;
        Blockly.Arduino.definitions_.define_variable_TM1637Display = `TM1637Display display(CLK, DIO);`;
        Blockly.Arduino.setups_.setup_brightness = `display.setBrightness(0x0f);`;
        return ``;
    }
    return ``;
};
Blockly.Arduino.display_TM1637Display = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const num = Blockly.Arduino.valueToCode(a, 'NUM', Blockly.Arduino.ORDER_ATOMIC);
        const dotStatus = Blockly.Arduino.valueToCode(a, 'DOT_STATUS', Blockly.Arduino.ORDER_ATOMIC);
        const leadingZero = Blockly.Arduino.valueToCode(a, 'LEADING_ZERO', Blockly.Arduino.ORDER_ATOMIC);

        let returnStr = ``;

        if (dotStatus === '0' && leadingZero === '0') {
            returnStr = `display.showNumberDec(${num})`;
        } else if (dotStatus === '0' && leadingZero === '1') {
            returnStr = `display.showNumberDec(${num}, true)`;
        } else if (dotStatus === '1' && leadingZero === '0') {
            returnStr = `display.showNumberDecEx(${num}, 0b01000000)`;
        } else if (dotStatus === '1' && leadingZero === '1') {
            returnStr = `display.showNumberDecEx(${num}, 0b01000000, true)`;
        }

        return `${returnStr}${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.display_resetTM1637Display = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        return `display.clear()${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.motor_motorForward = function (a) {
    Blockly.Arduino.setups_.setup_motor =
        'pinMode(4,OUTPUT);\n' +
        'pinMode(7,OUTPUT);\n' +
        'pinMode(5,OUTPUT);\n' +
        'pinMode(6,OUTPUT);\n';
    const speed = Blockly.Arduino.valueToCode(a, 'POWER', Blockly.Arduino.ORDER_ATOMIC) || '127';
    const code = `analogWrite(5,${speed});\n` +
        `analogWrite(6,${speed});\n` +
        `digitalWrite(7,LOW);\n` +
        `digitalWrite(4,LOW);\n`;
    return code;
};
Blockly.Arduino.motor_motorBackward = function (a) {
    Blockly.Arduino.setups_.setup_motor =
        'pinMode(4,OUTPUT);\n' +
        'pinMode(7,OUTPUT);\n' +
        'pinMode(5,OUTPUT);\n' +
        'pinMode(6,OUTPUT);\n';
    const speed = Blockly.Arduino.valueToCode(a, 'POWER', Blockly.Arduino.ORDER_ATOMIC) || '127';
    const code = `analogWrite(5,${speed});\n` +
        `analogWrite(6,${speed});\n` +
        `digitalWrite(7,HIGH);\n` +
        `digitalWrite(4,HIGH);\n`;
    return code;
};
Blockly.Arduino.motor_motorTurnRight = function (a) {
    Blockly.Arduino.setups_.setup_motor =
        'pinMode(4,OUTPUT);\n' +
        'pinMode(7,OUTPUT);\n' +
        'pinMode(5,OUTPUT);\n' +
        'pinMode(6,OUTPUT);\n';
    const speed = Blockly.Arduino.valueToCode(a, 'POWER', Blockly.Arduino.ORDER_ATOMIC) || '127';
    const code = `analogWrite(5,${speed});\n` +
        `analogWrite(6,0);\n` +
        `digitalWrite(7,LOW);\n` +
        `digitalWrite(4,LOW);\n`;
    return code;
};
Blockly.Arduino.motor_motorTurnLeft = function (a) {
    Blockly.Arduino.setups_.setup_motor =
        'pinMode(4,OUTPUT);\n' +
        'pinMode(7,OUTPUT);\n' +
        'pinMode(5,OUTPUT);\n' +
        'pinMode(6,OUTPUT);\n';
    const speed = Blockly.Arduino.valueToCode(a, 'POWER', Blockly.Arduino.ORDER_ATOMIC) || '127';
    const code = `${'analogWrite(5,0);\n' +
        'analogWrite(6,'}${speed});\n` +
        `digitalWrite(7,LOW);\n` +
        `digitalWrite(4,LOW);\n`;
    return code;
};
Blockly.Arduino.motor_motorStop = function (a) {
    Blockly.Arduino.setups_.setup_motor =
        'pinMode(4,OUTPUT);\n' +
        'pinMode(7,OUTPUT);\n' +
        'pinMode(5,OUTPUT);\n' +
        'pinMode(6,OUTPUT);\n';
    const code = 'analogWrite(5,0);\n' +
        'analogWrite(6,0);\n';
    return code;
};
Blockly.Arduino.sensor_setServoDegree = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const pin = Blockly.Arduino.valueToCode(a, 'PIN', Blockly.Arduino.ORDER_ATOMIC);
        const degree = Blockly.Arduino.valueToCode(a, 'DEGREE', Blockly.Arduino.ORDER_ATOMIC);
        Blockly.Arduino.includes_.servo = '#include <Servo.h>';
        Blockly.Arduino.variables_[`var_servo_${pin}`] = `Servo servo_${pin}${Blockly.Arduino.END}`;
        return `servo_${pin}.attach(${pin});\nservo_${pin}.write(${degree})${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.sensor_initPixy2 = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        Blockly.Arduino.includes_.spi = '#include <SPI.h>';
        Blockly.Arduino.includes_.pixy2 = '#include <Pixy2.h>';
        Blockly.Arduino.includes_.pidloop = '#include <PIDLoop.h>';
        Blockly.Arduino.variables_.pixy = `Pixy2 pixy;\n`;
        Blockly.Arduino.variables_.pidloop = `PIDLoop headingLoop(5000, 0, 0, false);\n`;

        Blockly.Arduino.setups_.pixyinit = `pixy.init();`;
        Blockly.Arduino.setups_.pixysetlamp = `pixy.setLamp(1, 1);`;
        Blockly.Arduino.setups_.pixychangeprog = `pixy.changeProg("line_tracking");`;

        Blockly.Arduino.loops_.res = `int8_t res;`;
        Blockly.Arduino.loops_.error = `int32_t error;`;
        Blockly.Arduino.loops_.leftandright = `int left, right;`;
        Blockly.Arduino.loops_.buf = `char buf[96];`;
        return ``;
    }
    return ``;
};
Blockly.Arduino.sensor_setRoboRaveTaskType = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const taskType = Blockly.Arduino.valueToCode(a, 'TASK_TYPE', Blockly.Arduino.ORDER_NONE);
        return `motors.setTaskFlag(${taskType})${Blockly.Arduino.END}`;
    }
    return ``;
};
Blockly.Arduino.sensor_refreshDataInTrackingModeFromPixy2 = function (a) {
    const blockstr = a.toString();
    if (blockstr.indexOf('?') === -1) {
        const pixy2Command = Blockly.Arduino.valueToCode(a, 'PIXY2_COMMAND', Blockly.Arduino.ORDER_NONE);
        if (pixy2Command === '0') {
            return `res = pixy.line.getMainFeatures()${Blockly.Arduino.END}`;
        }
        if (pixy2Command === '1') {
            return `error = (int32_t)pixy.line.vectors->m_x1 - (int32_t)X_CENTER;\nheadingLoop.update(error);\nleft = headingLoop.m_command;\nright = -headingLoop.m_command${Blockly.Arduino.END}`;
        }
        if (pixy2Command === '2') {
            return `left += ZUMO_SLOW;\nright += ZUMO_SLOW${Blockly.Arduino.END}`;
        }
        if (pixy2Command === '3') {
            return `left += ZUMO_FAST;\nright += ZUMO_FAST${Blockly.Arduino.END}`;
        }
        if (pixy2Command === '4') {
            return `pixy.line.reverseVector()${Blockly.Arduino.END}`;
        }

    }
    return ``;
};
Blockly.Arduino.sensor_pixy2FoundTheVector = function (a) {
    const foundVector = Blockly.Arduino.valueToCode(a, 'FOUND_VECTOR', Blockly.Arduino.ORDER_NONE);
    if (foundVector === '0') {
        return ['res&LINE_VECTOR', Blockly.Arduino.ORDER_ATOMIC];
    }
    if (foundVector === '1') {
        return ['res<=0', Blockly.Arduino.ORDER_ATOMIC];
    }
    if (foundVector === '2') {
        return ['pixy.line.vectors->m_y0 > pixy.line.vectors->m_y1', Blockly.Arduino.ORDER_ATOMIC];
    }
    if (foundVector === '3') {
        return ['pixy.line.vectors->m_flags&LINE_FLAG_INTERSECTION_PRESENT', Blockly.Arduino.ORDER_ATOMIC];
    }
    if (foundVector === '4') {
        return ['res&LINE_INTERSECTION', Blockly.Arduino.ORDER_ATOMIC];
    }

    return '';
};
Blockly.Arduino.motor_motorControl = function (a) {
    const speedL = Blockly.Arduino.valueToCode(a, 'POWERL', Blockly.Arduino.ORDER_ATOMIC) || '127';
    const speedR = Blockly.Arduino.valueToCode(a, 'POWERR', Blockly.Arduino.ORDER_ATOMIC) || '127';
    const blockString = a.toString();
    if (blockString.includes('L Forward') || blockString.includes('左马达转向为 前进')) {
        var dirL = 'HIGH';
    } else var dirL = 'LOW';
    if (blockString.includes('R Forward') || blockString.includes('右马达转向为 前进')) {
        var dirR = 'HIGH';
    } else var dirR = 'LOW';
    Blockly.Arduino.setups_.setup_motor =
        'pinMode(4,OUTPUT);\n' +
        'pinMode(7,OUTPUT);\n' +
        'pinMode(5,OUTPUT);\n' +
        'pinMode(6,OUTPUT);\n';
    const code = `  digitalWrite(4,${dirL});\n` +
        `  digitalWrite(7,${dirR});\n` +
        `  analogWrite(5,${speedR});\n` +
        `  analogWrite(6,${speedL});\n`;
    return code;
};
Blockly.Arduino.sensor_getVectorLocation = function (a) {
    const axis = Blockly.Arduino.valueToCode(a, 'AXIS', Blockly.Arduino.ORDER_ATOMIC);
    const direction = Blockly.Arduino.valueToCode(a, 'DIRECTION', Blockly.Arduino.ORDER_ATOMIC);
    if (axis === 'x') {
        if (direction === 'head') {
            return ['pixy.line.vectors->m_x1', Blockly.Arduino.ORDER_ATOMIC];
        }
    }
    return ['', Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.sensor_mecanumWheelSpeed = function (a) {
    Blockly.Arduino.includes_.mecanumwheel = `#include "Adafruit_MotorShield.h"\n#include "Adafruit_MS_PWMServoDriver.h"\n`;
    Blockly.Arduino.setups_.mecanumwheelinit = `AFMS.begin();\n`;
    Blockly.Arduino.variables_.afms = `Adafruit_MotorShield AFMS = Adafruit_MotorShield();`;
    Blockly.Arduino.variables_.motor1 = `Adafruit_DCMotor *m1Motor = AFMS.getMotor(1);`;
    Blockly.Arduino.variables_.motor2 = `Adafruit_DCMotor *m2Motor = AFMS.getMotor(2);`;
    Blockly.Arduino.variables_.motor3 = `Adafruit_DCMotor *m3Motor = AFMS.getMotor(3);`;
    Blockly.Arduino.variables_.motor4 = `Adafruit_DCMotor *m4Motor = AFMS.getMotor(4);`;
    Blockly.Arduino.definitions_.define_motorControl = `void motorControl(String motorStr,int mdirection, int mspeed){\n` +
        `${Blockly.Arduino.INDENT}if (motorStr == "rf") {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}if (mdirection == 1){\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}m2Motor->run(FORWARD);m2Motor->setSpeed(mspeed);\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}else if (mdirection == -1){\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}m2Motor->run(BACKWARD);m2Motor->setSpeed(mspeed);\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}else if (motorStr == "lf") {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}if (mdirection == 1){\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}m1Motor->run(FORWARD);m1Motor->setSpeed(mspeed);\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}else if (mdirection == -1){\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}m1Motor->run(BACKWARD);m1Motor->setSpeed(mspeed);\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}else if (motorStr == "rr") {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}if (mdirection == 1){\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}m4Motor->run(FORWARD);m4Motor->setSpeed(mspeed);\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}else if (mdirection == -1){\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}m4Motor->run(BACKWARD);m4Motor->setSpeed(mspeed);\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}else if (motorStr == "lr") {\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}if (mdirection == 1){\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}m3Motor->run(FORWARD);m3Motor->setSpeed(mspeed);\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}else if (mdirection == -1){\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}m3Motor->run(BACKWARD);m3Motor->setSpeed(mspeed);\n` +
        `${Blockly.Arduino.INDENT}${Blockly.Arduino.INDENT}}\n` +
        `${Blockly.Arduino.INDENT}}\n` +
        `}\n`;

    const which = Blockly.Arduino.valueToCode(a, 'WHICH', Blockly.Arduino.ORDER_ATOMIC);
    const direct = Blockly.Arduino.valueToCode(a, 'DIRECT', Blockly.Arduino.ORDER_ATOMIC);
    const speed = Blockly.Arduino.valueToCode(a, 'SPEED', Blockly.Arduino.ORDER_ATOMIC);
    var idx, wheelDirect;
    if (which === 'rightfront') {
        idx = 'rf';
    } else if (which === 'leftfront') {
        idx = 'lf';
    } else if (which === 'rightback') {
        idx = 'rr';
    } else if (which === 'leftback') {
        idx = 'lr';
    }

    if (direct === 'forward') {
        wheelDirect = 1;
    } else if (direct === 'reverse') {
        wheelDirect = -1;
    }

    return `motorControl("${idx}", ${wheelDirect}, ${speed})${Blockly.Arduino.END}`;
};

Blockly.Arduino.sensor_mecanumWheelStatus = function (a) {
    Blockly.Arduino.includes_.mecanumwheel = `#include "Adafruit_MotorShield.h"\n#include "Adafruit_MS_PWMServoDriver.h"\n`;
    Blockly.Arduino.setups_.mecanumwheelinit = `AFMS.begin();\n`;
    Blockly.Arduino.variables_.afms = `Adafruit_MotorShield AFMS = Adafruit_MotorShield();`;
    Blockly.Arduino.variables_.motor1 = `Adafruit_DCMotor *m1Motor = AFMS.getMotor(1);`;
    Blockly.Arduino.variables_.motor2 = `Adafruit_DCMotor *m2Motor = AFMS.getMotor(2);`;
    Blockly.Arduino.variables_.motor3 = `Adafruit_DCMotor *m3Motor = AFMS.getMotor(3);`;
    Blockly.Arduino.variables_.motor4 = `Adafruit_DCMotor *m4Motor = AFMS.getMotor(4);`;

    const status = Blockly.Arduino.valueToCode(a, 'STATUS', Blockly.Arduino.ORDER_ATOMIC);
    const speed = Blockly.Arduino.valueToCode(a, 'SPEED', Blockly.Arduino.ORDER_ATOMIC);
    if (status === 'forward') {
        Blockly.Arduino.definitions_.define_goforward = `void goForward(int mspeed){\n` +
            `${Blockly.Arduino.INDENT}m1Motor->run(FORWARD);m1Motor->setSpeed(mspeed);\n` +
            `${Blockly.Arduino.INDENT}m2Motor->run(FORWARD);m2Motor->setSpeed(mspeed);\n` +
            `${Blockly.Arduino.INDENT}m3Motor->run(FORWARD);m3Motor->setSpeed(mspeed);\n` +
            `${Blockly.Arduino.INDENT}m4Motor->run(FORWARD);m4Motor->setSpeed(mspeed);\n` +
            `}`;
        return `goForward(${speed})${Blockly.Arduino.END}`;
    } else if (status === 'back') {
        Blockly.Arduino.definitions_.define_gobackad = `void goBackwad(int mspeed){\n` +
            `${Blockly.Arduino.INDENT}m1Motor->run(BACKWARD);m1Motor->setSpeed(mspeed);\n` +
            `${Blockly.Arduino.INDENT}m2Motor->run(BACKWARD);m2Motor->setSpeed(mspeed);\n` +
            `${Blockly.Arduino.INDENT}m3Motor->run(BACKWARD);m3Motor->setSpeed(mspeed);\n` +
            `${Blockly.Arduino.INDENT}m4Motor->run(BACKWARD);m4Motor->setSpeed(mspeed);\n` +
            `}`;
        return `goBackwad(${speed})${Blockly.Arduino.END}`;
    } else if (status === 'stop') {
        Blockly.Arduino.definitions_.define_stopmotor = `void stopMotor(){\n` +
            `${Blockly.Arduino.INDENT}m1Motor->run(RELEASE);\n` +
            `${Blockly.Arduino.INDENT}m2Motor->run(RELEASE);\n` +
            `${Blockly.Arduino.INDENT}m3Motor->run(RELEASE);\n` +
            `${Blockly.Arduino.INDENT}m4Motor->run(RELEASE);\n` +
            `}`;
        return `stopMotor()${Blockly.Arduino.END}`;
    }

    return ``;
};

Blockly.Arduino.operator_add = Blockly.Arduino.operator_arithmetic;
Blockly.Arduino.operator_subtract = Blockly.Arduino.operator_arithmetic;
Blockly.Arduino.operator_multiply = Blockly.Arduino.operator_arithmetic;
Blockly.Arduino.operator_divide = Blockly.Arduino.operator_arithmetic;
Blockly.Arduino.operator_gt = Blockly.Arduino.operator_compare;
Blockly.Arduino.operator_equals = Blockly.Arduino.operator_compare;
Blockly.Arduino.operator_lt = Blockly.Arduino.operator_compare;
Blockly.Arduino.math_angle = Blockly.Arduino.math_number;
Blockly.Arduino.math_positive_number = Blockly.Arduino.math_number;
Blockly.Arduino.math_whole_number = Blockly.Arduino.math_number;
Blockly.Arduino.data_setVariableTo = Blockly.Arduino.data_setvariableto;
const addFunctionListener = (object, property, callback) => {
    const oldFn = object[property];
    object[property] = function () {
        const result = oldFn.apply(this, arguments);
        callback.apply(this, result);
        return result;
    };
};

const DroppableBlocks = DropAreaHOC([
    DragConstants.BACKPACK_CODE
])(BlocksComponent);

class Blocks extends React.Component {
    constructor(props) {
        super(props);
        this.ScratchBlocks = VMScratchBlocks(props.vm);
        bindAll(this, [
            'attachVM',
            'detachVM',
            'getToolboxXML',
            'handleCategorySelected',
            'handleConnectionModalStart',
            'handleConnectionModalClose',
            'handleDrop',
            'handleStatusButtonUpdate',
            'handleOpenSoundRecorder',
            'handlePromptStart',
            'handlePromptCallback',
            'handlePromptClose',
            'handleCustomProceduresClose',
            'onScriptGlowOn',
            'onScriptGlowOff',
            'onBlockGlowOn',
            'onBlockGlowOff',
            'handleExtensionAdded',
            'handleBlocksInfoUpdate',
            'onTargetsUpdate',
            'onVisualReport',
            'onWorkspaceUpdate',
            'onWorkspaceCodeUpdate',
            'onWorkspaceMetricsChange',
            'setBlocks',
            'sb2cpp',
            'setLocale',
            'UndoStacked'
        ]);
        this.redoStack_ = [];
        this.undoStack_ = [];
        this.ScratchBlocks.prompt = this.handlePromptStart;
        this.ScratchBlocks.statusButtonCallback = this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.state = {
            workspaceMetrics: {},
            prompt: null,
            connectionModal: null
        };
        this.onTargetsUpdate = debounce(this.onTargetsUpdate, 100);
        this.toolboxUpdateQueue = [];
        const { getInstance } = props;
        if (typeof getInstance === 'function') {
            getInstance(this);
        }
    }
    componentDidMount() {
        this.ScratchBlocks.FieldColourSlider.activateEyedropper_ = this.props.onActivateColorPicker;
        this.ScratchBlocks.Procedures.externalProcedureDefCallback = this.props.onActivateCustomProcedures;
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);

        const workspaceConfig = defaultsDeep({},
            Blocks.defaultOptions,
            this.props.options,
            { rtl: this.props.isRtl, toolbox: this.props.toolboxXML }
        );
        this.workspace = this.ScratchBlocks.inject(this.blocks, workspaceConfig);

        // Register buttons under new callback keys for creating variables,
        // lists, and procedures from extensions.

        const toolboxWorkspace = this.workspace.getFlyout().getWorkspace();

        const varListButtonCallback = type =>
            (() => this.ScratchBlocks.Variables.createVariable(this.workspace, null, type));
        const procButtonCallback = () => {
            this.ScratchBlocks.Procedures.createProcedureDefCallback_(this.workspace);
        };

        toolboxWorkspace.registerButtonCallback('MAKE_A_VARIABLE', varListButtonCallback(''));
        toolboxWorkspace.registerButtonCallback('MAKE_A_LIST', varListButtonCallback('list'));
        toolboxWorkspace.registerButtonCallback('MAKE_A_PROCEDURE', procButtonCallback);

        // Store the xml of the toolbox that is actually rendered.
        // This is used in componentDidUpdate instead of prevProps, because
        // the xml can change while e.g. on the costumes tab.
        this._renderedToolboxXML = this.props.toolboxXML;

        // we actually never want the workspace to enable "refresh toolbox" - this basically re-renders the
        // entire toolbox every time we reset the workspace.  We call updateToolbox as a part of
        // componentDidUpdate so the toolbox will still correctly be updated
        this.setToolboxRefreshEnabled = this.workspace.setToolboxRefreshEnabled.bind(this.workspace);
        this.workspace.setToolboxRefreshEnabled = () => {
            this.setToolboxRefreshEnabled(false);
        };

        // @todo change this when blockly supports UI events
        addFunctionListener(this.workspace, 'translate', this.onWorkspaceMetricsChange);
        addFunctionListener(this.workspace, 'zoom', this.onWorkspaceMetricsChange);

        this.attachVM();
        // Only update blocks/vm locale when visible to avoid sizing issues
        // If locale changes while not visible it will get handled in didUpdate
        if (this.props.isVisible) {
            this.setLocale();
        }
        analytics.pageview('/editors/blocks');
    }
    shouldComponentUpdate(nextProps, nextState) {
        return (
            this.state.prompt !== nextState.prompt ||
            this.state.connectionModal !== nextState.connectionModal ||
            this.props.isVisible !== nextProps.isVisible ||
            this._renderedToolboxXML !== nextProps.toolboxXML ||
            this.props.extensionLibraryVisible !== nextProps.extensionLibraryVisible ||
            this.props.customProceduresVisible !== nextProps.customProceduresVisible ||
            this.props.locale !== nextProps.locale ||
            this.props.anyModalVisible !== nextProps.anyModalVisible ||
            this.props.stageSize !== nextProps.stageSize
        );
    }
    componentDidUpdate(prevProps) {
        // If any modals are open, call hideChaff to close z-indexed field editors
        if (this.props.anyModalVisible && !prevProps.anyModalVisible) {
            this.ScratchBlocks.hideChaff();
        }

        // Only rerender the toolbox when the blocks are visible and the xml is
        // different from the previously rendered toolbox xml.
        // Do not check against prevProps.toolboxXML because that may not have been rendered.
        if (this.props.isVisible && this.props.toolboxXML !== this._renderedToolboxXML) {
            this.requestToolboxUpdate();
        }

        if (this.props.isVisible === prevProps.isVisible) {
            // if (this.props.stageSize !== prevProps.stageSize) {
            // force workspace to redraw for the new stage size
            window.dispatchEvent(new Event('resize'));
            // }
            return;
        }
        // @todo hack to resize blockly manually in case resize happened while hidden
        // @todo hack to reload the workspace due to gui bug #413
        if (this.props.isVisible) { // Scripts tab
            this.workspace.setVisible(true);
            if (prevProps.locale !== this.props.locale || this.props.locale !== this.props.vm.getLocale()) {
                // call setLocale if the locale has changed, or changed while the blocks were hidden.
                // vm.getLocale() will be out of sync if locale was changed while not visible
                this.setLocale();
            } else {
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
            }

            window.dispatchEvent(new Event('resize'));
        } else {
            this.workspace.setVisible(false);
        }
    }
    componentWillUnmount() {
        this.detachVM();
        this.workspace.dispose();
        clearTimeout(this.toolboxUpdateTimeout);
    }
    requestToolboxUpdate() {
        clearTimeout(this.toolboxUpdateTimeout);
        this.toolboxUpdateTimeout = setTimeout(() => {
            this.updateToolbox();
        }, 0);
    }
    setLocale() {
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);
        this.props.vm.setLocale(this.props.locale, this.props.messages)
            .then(() => {
                this.workspace.getFlyout().setRecyclingEnabled(false);
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
                this.withToolboxUpdates(() => {
                    this.workspace.getFlyout().setRecyclingEnabled(true);
                });
            });
    }

    updateToolbox() {
        this.toolboxUpdateTimeout = false;

        const categoryId = this.workspace.toolbox_.getSelectedCategoryId();
        const offset = this.workspace.toolbox_.getCategoryScrollOffset();
        this.workspace.updateToolbox(this.props.toolboxXML);
        this._renderedToolboxXML = this.props.toolboxXML;

        // In order to catch any changes that mutate the toolbox during "normal runtime"
        // (variable changes/etc), re-enable toolbox refresh.
        // Using the setter function will rerender the entire toolbox which we just rendered.
        this.workspace.toolboxRefreshEnabled_ = true;

        const currentCategoryPos = this.workspace.toolbox_.getCategoryPositionById(categoryId);
        const currentCategoryLen = this.workspace.toolbox_.getCategoryLengthById(categoryId);
        if (offset < currentCategoryLen) {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos + offset);
        } else {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos);
        }

        const queue = this.toolboxUpdateQueue;
        this.toolboxUpdateQueue = [];
        queue.forEach(fn => fn());
    }

    withToolboxUpdates(fn) {
        // if there is a queued toolbox update, we need to wait
        if (this.toolboxUpdateTimeout) {
            this.toolboxUpdateQueue.push(fn);
        } else {
            fn();
        }
    }

    attachVM() {
        this.workspace.addChangeListener(this.props.vm.blockListener);
        this.flyoutWorkspace = this.workspace
            .getFlyout()
            .getWorkspace();
        // this.workspace.addChangeListener(this.props.timeTranslate);
        this.workspace.addChangeListener(this.onWorkspaceCodeUpdate);
        this.flyoutWorkspace.addChangeListener(this.props.vm.flyoutBlockListener);
        this.flyoutWorkspace.addChangeListener(this.props.vm.monitorBlockListener);
        this.props.vm.addListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.addListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.addListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.addListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.addListener('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.addListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.addListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.addListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.addListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.addListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.addListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
    }
    detachVM() {
        this.props.vm.removeListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.removeListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.removeListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.removeListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.removeListener('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.removeListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.removeListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.removeListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.removeListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.removeListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
    }

    updateToolboxBlockValue(id, value) {
        this.withToolboxUpdates(() => {
            const block = this.workspace
                .getFlyout()
                .getWorkspace()
                .getBlockById(id);
            if (block) {
                block.inputList[0].fieldRow[0].setValue(value);
            }
        });
    }

    onTargetsUpdate() {
        if (this.props.vm.editingTarget && this.workspace.getFlyout()) {
            ['glide', 'move', 'set'].forEach(prefix => {
                this.updateToolboxBlockValue(`${prefix}x`, Math.round(this.props.vm.editingTarget.x).toString());
                this.updateToolboxBlockValue(`${prefix}y`, Math.round(this.props.vm.editingTarget.y).toString());
            });
        }
    }
    onWorkspaceMetricsChange() {
        const target = this.props.vm.editingTarget;
        if (target && target.id) {
            const workspaceMetrics = Object.assign({}, this.state.workspaceMetrics, {
                [target.id]: {
                    scrollX: this.workspace.scrollX,
                    scrollY: this.workspace.scrollY,
                    scale: this.workspace.scale
                }
            });
            this.setState({ workspaceMetrics });
        }
    }
    onScriptGlowOn(data) {
        this.workspace.glowStack(data.id, true);
    }
    onScriptGlowOff(data) {
        this.workspace.glowStack(data.id, false);
    }
    onBlockGlowOn(data) {
        this.workspace.glowBlock(data.id, true);
    }
    onBlockGlowOff(data) {
        this.workspace.glowBlock(data.id, false);
    }
    onVisualReport(data) {
        this.workspace.reportValue(data.id, data.value);
    }
    getToolboxXML() {
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let { editingTarget: target, runtime } = this.props.vm;
            const stage = runtime.getTargetForStage();
            if (!target) target = stage; // If no editingTarget, use the stage

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();
            const dynamicBlocksXML = this.props.vm.runtime.getBlocksXML();
            return makeToolboxXML(target.isStage, target.id, dynamicBlocksXML,
                targetCostumes[0].name,
                stageCostumes[0].name,
                targetSounds.length > 0 ? targetSounds[0].name : ''
            );
        } catch {
            return null;
        }
    }
    onWorkspaceUpdate(data) {
        // When we change sprites, update the toolbox to have the new sprite's blocks
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }

        if (this.props.vm.editingTarget && !this.state.workspaceMetrics[this.props.vm.editingTarget.id]) {
            this.onWorkspaceMetricsChange();
        }

        // Remove and reattach the workspace listener (but allow flyout events)
        this.workspace.removeChangeListener(this.props.vm.blockListener);
        const dom = this.ScratchBlocks.Xml.textToDom(data.xml);
        try {
            this.ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(dom, this.workspace);
        } catch (error) {
            // The workspace is likely incomplete. What did update should be
            // functional.
            //
            // Instead of throwing the error, by logging it and continuing as
            // normal lets the other workspace update processes complete in the
            // gui and vm, which lets the vm run even if the workspace is
            // incomplete. Throwing the error would keep things like setting the
            // correct editing target from happening which can interfere with
            // some blocks and processes in the vm.
            if (error.message) {
                error.message = `Workspace Update Error: ${error.message}`;
            }
            log.error(error);
        }
        this.workspace.addChangeListener(this.props.vm.blockListener);

        if (this.props.vm.editingTarget && this.state.workspaceMetrics[this.props.vm.editingTarget.id]) {
            const { scrollX, scrollY, scale } = this.state.workspaceMetrics[this.props.vm.editingTarget.id];
            this.workspace.scrollX = scrollX;
            this.workspace.scrollY = scrollY;
            this.workspace.scale = scale;
            this.workspace.resize();
        }

        // Clear the undo state of the workspace since this is a
        // fresh workspace and we don't want any changes made to another sprites
        // workspace to be 'undone' here.
        this.workspace.clearUndo();
    }
    handleExtensionAdded(blocksInfo) {
        // select JSON from each block info object then reject the pseudo-blocks which don't have JSON, like separators
        // this actually defines blocks and MUST run regardless of the UI state
        this.ScratchBlocks.defineBlocksWithJsonArray(blocksInfo.map(blockInfo => blockInfo.json).filter(x => x));

        // Update the toolbox with new blocks
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }
    }
    handleBlocksInfoUpdate(blocksInfo) {
        // @todo Later we should replace this to avoid all the warnings from redefining blocks.
        this.handleExtensionAdded(blocksInfo);
    }
    handleCategorySelected(categoryId) {
        const extension = extensionData.find(ext => ext.extensionId === categoryId);
        if (extension && extension.launchPeripheralConnectionFlow) {
            this.handleConnectionModalStart(categoryId);
        }

        this.withToolboxUpdates(() => {
            this.workspace.toolbox_.setSelectedCategoryById(categoryId);
        });
    }

    onWorkspaceCodeUpdate(e) {
        console.log(`onWorkspaceCodeUpdate = `);
        console.log(e.type);
        if ('endDrag' === e.type
            || 'delete' === e.type
            || 'create' === e.type
            || 'change' === e.type
            || 'var_rename' === e.type) {
            this.props.timeTranslate();
        }
    }

    sb2cpp() {

        let code = '';
        try {
            code = Blockly.Arduino.workspaceToCode(this.workspace, false, 'arduino');
            return code;
        } catch (e) {
            alert(`${e.message}. Translation failed. Exit auto-translate mode.`);
            console.log(e);
            code = 'error';
        }
        return code;
    }
    setBlocks(blocks) {
        this.blocks = blocks;
    }
    handlePromptStart(message, defaultValue, callback, optTitle, optVarType) {
        const p = { prompt: { callback, message, defaultValue } };
        p.prompt.title = optTitle ? optTitle :
            this.ScratchBlocks.Msg.VARIABLE_MODAL_TITLE;
        p.prompt.varType = typeof optVarType === 'string' ?
            optVarType : this.ScratchBlocks.SCALAR_VARIABLE_TYPE;
        p.prompt.showVariableOptions = // This flag means that we should show variable/list options about scope
            optVarType !== this.ScratchBlocks.BROADCAST_MESSAGE_VARIABLE_TYPE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_VARIABLE_MODAL_TITLE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_LIST_MODAL_TITLE;
        p.prompt.showCloudOption = (optVarType === this.ScratchBlocks.SCALAR_VARIABLE_TYPE) && this.props.canUseCloud;
        this.setState(p);
    }
    handleConnectionModalStart(extensionId) {
        this.props.onOpenConnectionModal(extensionId);
    }
    handleConnectionModalClose() {
        this.setState({ connectionModal: null });
    }
    handleStatusButtonUpdate() {
        this.ScratchBlocks.refreshStatusButtons(this.workspace);
    }
    handleOpenSoundRecorder() {
        this.props.onOpenSoundRecorder();
    }

    /*
     * Pass along information about proposed name and variable options (scope and isCloud)
     * and additional potentially conflicting variable names from the VM
     * to the variable validation prompt callback used in scratch-blocks.
     */
    handlePromptCallback(input, variableOptions) {
        this.state.prompt.callback(
            input,
            this.props.vm.runtime.getAllVarNamesOfType(this.state.prompt.varType),
            variableOptions);
        this.handlePromptClose();
    }
    handlePromptClose() {
        this.setState({ prompt: null });
    }
    handleCustomProceduresClose(data) {
        this.props.onRequestCloseCustomProcedures(data);
        const ws = this.workspace;
        ws.refreshToolboxSelection_();
        ws.toolbox_.scrollToCategoryById('myBlocks');
    }
    handleDrop(dragInfo) {
        fetch(dragInfo.payload.bodyUrl)
            .then(response => response.json())
            .then(blocks => this.props.vm.shareBlocksToTarget(blocks, this.props.vm.editingTarget.id))
            .then(() => {
                this.props.vm.refreshWorkspace();
                this.updateToolbox(); // To show new variables/custom blocks
            });
    }
    UndoStacked(e) { // 撤销
        this.ScratchBlocks.hideChaff();
        this.ScratchBlocks.mainWorkspace.undo(e);
    }
    render() {
        /* eslint-disable no-unused-vars */
        const {
            anyModalVisible,
            canUseCloud,
            customProceduresVisible,
            extensionLibraryVisible,
            options,
            // stageSize,
            vm,
            isRtl,
            isVisible,
            onActivateColorPicker,
            onOpenConnectionModal,
            onOpenSoundRecorder,
            updateToolboxState,
            onActivateCustomProcedures,
            onRequestCloseExtensionLibrary,
            onRequestCloseCustomProcedures,
            toolboxXML,
            ...props
        } = this.props;
        /* eslint-enable no-unused-vars */
        return (
            <div>
                <DroppableBlocks
                    componentRef={this.setBlocks}
                    onDrop={this.handleDrop}
                    {...props}
                />
                {this.state.prompt ? (
                    <Prompt
                        defaultValue={this.state.prompt.defaultValue}
                        isStage={vm.runtime.getEditingTarget().isStage}
                        label={this.state.prompt.message}
                        showCloudOption={this.state.prompt.showCloudOption}
                        showVariableOptions={this.state.prompt.showVariableOptions}
                        title={this.state.prompt.title}
                        onCancel={this.handlePromptClose}
                        onOk={this.handlePromptCallback}
                    />
                ) : null}
                {this.state.connectionModal ? (
                    <ConnectionModal
                        {...this.state.connectionModal}
                        vm={vm}
                        onCancel={this.handleConnectionModalClose}
                        onStatusButtonUpdate={this.handleStatusButtonUpdate}
                    />
                ) : null}
                {extensionLibraryVisible ? (
                    <ExtensionLibrary
                        vm={vm}
                        onCategorySelected={this.handleCategorySelected}
                        onRequestClose={onRequestCloseExtensionLibrary}
                    />
                ) : null}
                {customProceduresVisible ? (
                    <CustomProcedures
                        options={{
                            media: options.media
                        }}
                        onRequestClose={this.handleCustomProceduresClose}
                    />
                ) : null}
            </div>
        );
    }
}

Blocks.propTypes = {
    anyModalVisible: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    customProceduresVisible: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    isRtl: PropTypes.bool,
    isVisible: PropTypes.bool,
    locale: PropTypes.string,
    messages: PropTypes.objectOf(PropTypes.string),
    onActivateColorPicker: PropTypes.func,
    onActivateCustomProcedures: PropTypes.func,
    onOpenConnectionModal: PropTypes.func,
    onOpenSoundRecorder: PropTypes.func,
    onRequestCloseCustomProcedures: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number
        }),
        colours: PropTypes.shape({
            workspace: PropTypes.string,
            flyout: PropTypes.string,
            toolbox: PropTypes.string,
            toolboxSelected: PropTypes.string,
            scrollbar: PropTypes.string,
            scrollbarHover: PropTypes.string,
            insertionMarker: PropTypes.string,
            insertionMarkerOpacity: PropTypes.number,
            fieldShadow: PropTypes.string,
            dragShadowOpacity: PropTypes.number
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool
    }),
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    toolboxXML: PropTypes.string,
    updateToolboxState: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

Blocks.defaultOptions = {
    zoom: {
        controls: true,
        wheel: true,
        startScale: 0.675
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: '#ddd'
    },
    colours: {
        workspace: '#F9F9F9',
        flyout: '#F9F9F9',
        toolbox: '#FFFFFF',
        toolboxSelected: '#E9EEF2',
        scrollbar: '#CECDCE',
        scrollbarHover: '#CECDCE',
        insertionMarker: '#000000',
        insertionMarkerOpacity: 0.2,
        fieldShadow: 'rgba(255, 255, 255, 0.3)',
        dragShadowOpacity: 0.6
    },
    comments: true,
    collapse: false,
    sounds: false
};

Blocks.defaultProps = {
    isVisible: true,
    options: Blocks.defaultOptions
};

const mapStateToProps = state => ({
    anyModalVisible: (
        Object.keys(state.scratchGui.modals).some(key => state.scratchGui.modals[key]) ||
        state.scratchGui.mode.isFullScreen
    ),
    extensionLibraryVisible: state.scratchGui.modals.extensionLibrary,
    isRtl: state.locales.isRtl,
    locale: state.locales.locale,
    messages: state.locales.messages,
    toolboxXML: state.scratchGui.toolbox.toolboxXML,
    customProceduresVisible: state.scratchGui.customProcedures.active
});

const mapDispatchToProps = dispatch => ({
    onActivateColorPicker: callback => dispatch(activateColorPicker(callback)),
    onActivateCustomProcedures: (data, callback) => dispatch(activateCustomProcedures(data, callback)),
    onOpenConnectionModal: id => {
        dispatch(setConnectionModalExtensionId(id));
        dispatch(openConnectionModal());
    },
    onOpenSoundRecorder: () => {
        dispatch(activateTab(SOUNDS_TAB_INDEX));
        dispatch(openSoundRecorder());
    },
    onRequestCloseExtensionLibrary: () => {
        dispatch(closeExtensionLibrary());
    },
    onRequestCloseCustomProcedures: data => {
        dispatch(deactivateCustomProcedures(data));
    },
    updateToolboxState: toolboxXML => {
        dispatch(updateToolbox(toolboxXML));
    }
});

export default errorBoundaryHOC('Blocks')(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(Blocks)
);
