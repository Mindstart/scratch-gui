import bindAll from 'lodash.bindall';
import React from 'react';
import ArduinoPanelComponent from '../components/arduino-panel/arduino-panel.jsx';

class ArduinoPanel extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            editorCode: this.props.editorCode,
            codes: this.props.codes
        };
    }

    componentWillReceiveProps (nextProps, nextState) {
        this.setState({
            codes: nextProps.codes,
            code: nextState.codes
        })
    }
    render () {
        const {
            ...props
        } = this.props;
        return (
            <ArduinoPanelComponent
                visible={this.props.visible}
                code={this.props.code}
                consoleMsg={this.props.consoleMsg}
                translateCode={this.props.translateCode}
                uploadProj={this.props.uploadProj}
                openIno={this.props.openIno}
                codeRef={this.props.updateEditorInstance}
                translateChecked={this.props.translateChecked}
                // handleInputChange={this.props.handleInputChange}
                firmata={this.props.firmata}
                windowHeight={this.props.windowHeight}
                {...props}
            />
        );
    }

}

ArduinoPanel.propTypes = {
    // visible: React.PropTypes.bool,
};

export default ArduinoPanel;
