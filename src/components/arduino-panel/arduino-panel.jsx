const React = require('react');
import {Button,FormControl} from 'react-bootstrap';
import AceEditor from 'react-ace';
import 'brace/mode/java';
import 'brace/theme/eclipse';
import styles from './arduino-panel.css';
import classNames from 'classnames';

const arduinoIcon = require('./arduino.png');
import {FormattedMessage} from 'react-intl';

class ArduinoPanelComponent extends React.Component {
    constructor (props) {              
        super(props);
    }
    componentDidUpdate(){
         let logs = this.refs.arduinolog;
         let lastLog = logs.childNodes[logs.childNodes.length-1];
         if(lastLog) {
            lastLog.scrollIntoView();
        }
    }
    render() {
        const {
            code,
            consoleMsg,
            codeRef,
            ...componentProps
        } = this.props;
        var visible = this.props.visible?'block':'none';
        const  msgs = [];
        for (var i = 0; i <  this.props.consoleMsg.length; i += 1) {
            var t =  this.props.consoleMsg[i];
            msgs.push(<p style={{color:t.color}} key={i}>{t.msg}</p>);
        };
        var panelHeight=this.props.windowHeight-'3.1rem';
        var panelWidth=this.props.windowWidth*30/100;
        return (<div
                style={{
		 		    borderStyle: 'groove',
				    borderColor: 'grey',
				    borderRadius: '8px',
                    position: 'fixed',
                    display: visible,
                    zIndex: '50',
                    right: '1px',
                    width: '490px',
                    height: panelHeight,
                    top: '3.1rem',
                    bottom: '2px',
                    backgroundColor: '#4C97FF',
                }}
            >
            <div className="group" id="code-buttons" style={{top:4,left:4,width:480,position:'absolute'}}>
                <Button className={classNames(styles.button)} onClick={this.props.translateCode}>
					<input type="checkbox" checked={this.props.translateChecked} onChange={this.props.handleInputChange}/>
					<FormattedMessage
					 defaultMessage=" Translate"
					 id="gui.arduino-panel.translate"/>
				</Button>
                <Button className={classNames(styles.button)} onClick={this.props.selectBaud}>
					<FormattedMessage
					 defaultMessage="Firmata"
					 id="gui.arduino-panel.firmata"/> 
				</Button>
                <Button className={classNames(styles.button)} onClick={this.props.uploadProj}>
					<FormattedMessage
					 defaultMessage="Upload"
					 id="gui.arduino-panel.upload"/>
				</Button>
                <Button className={classNames(styles.button)} onClick={this.props.openIno}>{<img style={{height: 20}} src={arduinoIcon}/>} Arduino
				</Button>
            </div>
            <AceEditor
                style={{top:45,left:2,right:2,height:'80%',width:480}}
                mode="c_cpp"
                theme="eclipse"
                name="arduino-code"
                value={code}
                editorProps={{$blockScrolling: true}}
                ref={codeRef}
            />
            <div id="console-log"
                style={{
                    position: 'relative',
                    left:2,
					right:2,
                    width:480,
                    height:'12%',
                    top: 50,
                    overflowY: 'scroll',
                    backgroundColor: '#000000',
                    color: '#008000',
                    fontSize: 10
                }}
                ref="arduinolog"
            >{msgs}
			</div>
            </div>
        );
    }
};

export default  ArduinoPanelComponent;