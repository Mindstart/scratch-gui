import AudioEngine from 'scratch-audio';
import PropTypes from 'prop-types';
import React from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux';
import ReactModal from 'react-modal';
import VM from 'scratch-vm';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {
    getIsError,
    getIsShowingProject
} from '../reducers/project-state';
import {setProjectTitle} from '../reducers/project-title';
import ArduinoPanel from './arduino-panel.jsx';
import Blocks from './blocks.jsx';
import {
    activateTab,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';

import {
    closeCostumeLibrary,
    closeBackdropLibrary,
    closeTelemetryModal,
    openExtensionLibrary
} from '../reducers/modals';

import FontLoaderHOC from '../lib/font-loader-hoc.jsx';
import LocalizationHOC from '../lib/localization-hoc.jsx';
import ProjectFetcherHOC from '../lib/project-fetcher-hoc.jsx';
import ProjectSaverHOC from '../lib/project-saver-hoc.jsx';
import QueryParserHOC from '../lib/query-parser-hoc.jsx';
import storage from '../lib/storage';
import vmListenerHOC from '../lib/vm-listener-hoc.jsx';
import vmManagerHOC from '../lib/vm-manager-hoc.jsx';
import cloudManagerHOC from '../lib/cloud-manager-hoc.jsx';
import bindAll from 'lodash.bindall';
import GUIComponent from '../components/gui/gui.jsx';
import {setIsScratchDesktop} from '../lib/isScratchDesktop.js';
import {STAGE_SIZE_MODES} from '../lib/layout-constants';

const messages = defineMessages({
    defaultProjectTitle: {
        id: 'gui.gui.defaultProjectTitle',
        description: 'Default title for project',
        defaultMessage: 'Scratch Project'
    },
	welcomeMsg: {
		id: 'gui.gui.welcomeMsg',
		description: 'Default welcome message',
		defaultMessage: 'Welcome to Ainoview!'
	},
	prepareStatus: {
		id: 'gui.gui.prepareStatus',
		description: 'Waiting ino file to be generated',
		defaultMessage: 'Preparing Sketch...'
	},
	compileStatus: {
		id: 'gui.gui.compileStatus',
		description: 'Compile ino file',
		defaultMessage: 'Compiling scripts...'
	},
	uploadSuccess: {
        id: 'gui.gui.uploadSuccess',
		description: 'upload success message',
        defaultMessage: 'Upload Completed!'
	},
    emptyPort: {
		id: 'gui.gui.emptyPort',
		description: 'empty com port selection',
		defaultMessage: 'Error: Arduino port is not selected'
	},
	errorPort: {
		id: 'gui.gui.errorPort',
		description: 'Port value is not received',
		defaultMessage: 'Error: Selected port is missing'
	},
	errorConnect: {
		id: 'gui.gui.errorConnect',
		description: 'Error message from helper.js or arduino builder',
		defaultMessage: 'Error: Cannot connect to backend helper.'
	},
	errorUnknown: {
		id: 'gui.gui.errorUnknown',
		description: 'Error message from helper.js or arduino builder',
		defaultMessage: 'Error: Cannot complete the process, see the following details.'
	}
});

import {upload} from '../upload/upload';

class GUI extends React.Component {

    constructor (props) {
        super(props);
        bindAll(this, ['toggleArduinoPanel', 'toggelStage', 'timeTranslate', 'appendLog', 'updateLog',
            'handleInputChange', 'updateEditorInstance', 'translateCode', 'selectBaudRate',
			'openIno','uploadProject']);
        this.consoleMsgBuff = [{msg: props.intl.formatMessage(messages.welcomeMsg), color: 'green'}];
        this.editor;
        this.state = {
            loading: !props.vm.initialized,
            loadingError: false,
            showarduinopanel: false,
            showstage: true,
            editorCode: '#include <Arduino.h>\n\nvoid setup(){\n}\n\nvoid loop(){\n}\n',
            translateChecked: false,
            windowHeight: window.innerHeight,
            windowWidth: window.innerWidth,
            errorMessage: '',
            currentModal: null,
            showArduinoPanel: false,
            showStage: true,
            showPopups: false,
            connectedPort: null,
            consoleMsg: this.consoleMsgBuff,
            getInputValue: 'Scratch 3.0 GUI',
            timeWorkspace: null
        };
    }
    componentDidMount () {
        setIsScratchDesktop(this.props.isScratchDesktop);
        this.setReduxTitle(this.props.projectTitle);
        this.props.onStorageInit(storage);

        if (this.props.vm.initialized) return;
        this.audioEngine = new AudioEngine();
        this.props.vm.attachAudioEngine(this.audioEngine);
        this.props.vm.loadProject(this.props.projectData)
            .then(() => {
                this.setState({loading: false}, () => {
                    this.props.vm.setCompatibilityMode(true);
                    this.props.vm.start();
                });
            })
            .catch(e => {
                // Need to catch this error and update component state so that
                // error page gets rendered if project failed to load
                this.setState({loadingError: true, errorMessage: e});
            });
        this.props.vm.initialized = true;
    }
    componentWillReceiveProps (nextProps) {
        if (this.props.projectData !== nextProps.projectData) {
            this.setState({loading: true}, () => {
                this.props.vm.loadProject(nextProps.projectData)
                    .then(() => {
                        this.setState({loading: false});
                    })
                    .catch(e => {
                        // Need to catch this error and update component state so that
                        // error page gets rendered if project failed to load
                        this.setState({loadingError: true, errorMessage: e});
                    });
            });
        }
        if (this.props.projectTitle !== nextProps.projectTitle) {
            this.props.onUpdateReduxProjectTitle(nextProps.projectTitle);
        }
    }
    componentDidUpdate (prevProps) {
        if (this.props.projectId !== prevProps.projectId && this.props.projectId !== null) {
            this.props.onUpdateProjectId(this.props.projectId);
        }
        if (this.props.projectTitle !== prevProps.projectTitle) {
            this.setReduxTitle(this.props.projectTitle);
        }
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            // this only notifies container when a project changes from not yet loaded to loaded
            // At this time the project view in www doesn't need to know when a project is unloaded
            this.props.onProjectLoaded();
        }
    }
	selectBaudRate(){
		
	}
    toggleArduinoPanel (){
        this.setState({showarduinopanel: !this.state.showarduinopanel});
    }
    toggelStage (){
        this.setState({showstage: !this.state.showstage});
    }
    timeTranslate (){
        if (this.state.translateChecked){
            const code = this.childCp.sb2cpp();
            if (code === 'error') {
                this.setState({translateChecked: false});
                this.childCp.workspace.undo(true);
            } else {
                this.setState({editorCode: code});
            }
        }
    }
    handleInputChange (event){
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.setState({
            translateChecked: value}
        );
    }
    updateEditorInstance (editor){
        this.editor = editor;
    }
    translateCode () {
        const code = this.childCp.sb2cpp();
		if(code !== 'error') {
			this.setState({editorCode: code, timeWorkspace: this.childCp});	
		}
    }
    appendLog (msg, color) {
        if (!color) {
            color = 'Gray';
        }
        this.consoleMsgBuff.push({msg: msg, color: color});
        this.setState({consoleMsg: this.consoleMsgBuff});
    }
    updateLog () {
        console.log('Log 1: '+global.uploadMessage);
        if (global.uploadMessage != '' && global.uploadMessage != 'complete'){
            if(global.uploadMessage == 'success'){
				this.appendLog(this.props.intl.formatMessage(messages.uploadSuccess), 'green');
				global.uploadMessage = 'complete';
			}
			else if(global.uploadMessage == 'compile'){
				this.appendLog(this.props.intl.formatMessage(messages.compileStatus), 'white');
				global.uploadMessage = '';
			}
			else if(global.uploadMessage == 'badport'){
				this.appendLog(this.props.intl.formatMessage(messages.errorPort), 'red');
				global.uploadMessage = 'complete';
			}
			else if(global.uploadMessage == 'Connection Error'){
				this.appendLog(this.props.intl.formatMessage(messages.errorConnect), 'red');
				global.uploadMessage = 'complete';
			}
			else{
				this.appendLog(this.props.intl.formatMessage(messages.errorUnknown), 'red');
				this.appendLog(global.uploadMessage, 'red');
				global.uploadMessage = 'complete';
			}
        }
    }
	openIno (){
		const code = this.state.editorCode.toString();
		upload('openIno', code);
	}
    uploadProject () {
        const code = this.state.editorCode.toString();
		this.appendLog(this.props.intl.formatMessage(messages.prepareStatus), 'white');
		global.uploadMessage = '';
		if(global.port_connect == null){
			global.uploadMessage = this.props.intl.formatMessage(messages.emptyPort);
			this.appendLog(global.uploadMessage, 'red');
		}
		else{
			upload(global.port_connect, code);
			const check = setInterval(this.updateLog, 1000);
			const remove = setInterval(function (){
				if(global.uploadMessage == 'complete'){
					clearInterval(check);
					clearInterval(remove);
				}
			}, 1000);
		}
		/*if (first_time_upload == false){
            chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function (entry){
				if(entry == null){
					first_time_upload = false;
					global.uploadMessage = 'Error: Sketch directory is undefined';
				}
				else {
					fs_chrome = WebFS(entry);
					chrome.fileSystem.getDisplayPath(entry, function (path){
						console.log('Path: ' + path);
					});
					fs_chrome.writeFile('./sketch.ino', code, function (err){
						if (err == null) {
							if(global.port_connect == null){
								global.uploadMessage = 'Error: Arduino port is not selected';

							}
							else {
								upload(global.port_connect, code);
							}
							first_time_upload = true;
						}
						else {
							global.uploadMessage = err.toString();
						}
					});
			   }
            });
        }
		else if (first_time_upload == true){
            fs_chrome.writeFile('./sketch.ino', code, function (err){
                if (err == null) {
					if(global.port_connect == null){
						global.uploadMessage = 'Error: Arduino port is not selected';
					}
					else{
						upload(global.port_connect, code);
					}
                }
				else {
					global.uploadMessage = err.toString();
				}
            });
        }
		const check = setInterval(this.updateLog, 1000);
		const remove = setInterval(function (){
			if(global.uploadMessage == 'complete'){
				clearInterval(check);
				clearInterval(remove);
			}
		}, 1000);*/
    }
    setReduxTitle (newTitle) {
        if (newTitle === null || typeof newTitle === 'undefined') {
            this.props.onUpdateReduxProjectTitle(
                this.props.intl.formatMessage(messages.defaultProjectTitle)
            );
        } else {
            this.props.onUpdateReduxProjectTitle(newTitle);
        }
    }
    render () {
        if (this.props.isError) {
            throw new Error(
                `Error in Scratch GUI [location=${window.location}]: ${this.props.error}`);
        }
        const {
            /* eslint-disable no-unused-vars */
            assetHost,
			hideIntro,
            cloudHost,
            error,
            isError,
            isScratchDesktop,
            isShowingProject,
            onProjectLoaded,
            onStorageInit,
            onUpdateProjectId,
            onUpdateReduxProjectTitle,
            projectHost,
            projectId,
            projectTitle,
            /* eslint-enable no-unused-vars */
			projectData,
			children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
			vm,

            ...componentProps
        } = this.props;
        return (
            <GUIComponent
                loading={fetchingProject || isLoading || loadingStateVisible}
                toggleArduinoPanel={this.toggleArduinoPanel}
                editorCode={this.state.editorCode}
                showstage={this.state.showstage}
                windowHeight={this.state.windowHeight}
                vm={vm}
                togglePopup={this.togglePopup}
                showarduinopanel={this.state.showarduinopanel}
                showPopups={this.state.showPopups}
                getInputValue={this.state.getInputValue}
                onChange={this.onChange}
                reloadPlay={this.reloadPlay}
                UndoStack={this.UndoStack}
                code={this.state.editorCode}
                updateEditorInstance={this.updateEditorInstance}
                {...componentProps}
            >
                {/*{children}*/}
                <ArduinoPanel visible={this.state.showarduinopanel}
                              code={this.state.editorCode}
                              vm={vm}
                              consoleMsg={this.state.consoleMsg}
                              editorCode={this.state.editorCode}
                              translateCode={this.translateCode}
                              uploadProj={this.uploadProject}
                              openIno={this.openIno}
                              //firmata={this.firmata}
                              translateChecked={this.state.translateChecked}
                              handleInputChange={this.handleInputChange}
                              updateEditorInstance={this.updateEditorInstance}
                />
                <Blocks
                    grow={1}
                    getInstance = {(childCp) => {this.childCp = childCp;}}
                    isVisible={true}
                    timeTranslate={this.timeTranslate}
                    options={{
                        media: `${this.props.basePath}static/blocks-media/`
                    }}
                    stageSize={STAGE_SIZE_MODES.large}
                    showstage={this.state.showstage}
                    vm={vm}

                />
            </GUIComponent>
        );
    }
}

GUI.propTypes = {
    assetHost: PropTypes.string,
    children: PropTypes.node,
    cloudHost: PropTypes.string,
    editorCode: PropTypes.string,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    fetchingProject: PropTypes.bool,
    hideIntro: PropTypes.bool,
    importInfoVisible: PropTypes.bool,
    intl: intlShape,
    isError: PropTypes.bool,
    isLoading: PropTypes.bool,
    isScratchDesktop: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    onProjectLoaded: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onStorageInit: PropTypes.func,
    onUpdateProjectId: PropTypes.func,
    onUpdateProjectTitle: PropTypes.func,
    onUpdateReduxProjectTitle: PropTypes.func,
    previewInfoVisible: PropTypes.bool,
    projectData: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    projectHost: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectTitle: PropTypes.string,
    showstage: PropTypes.string,
    telemetryModalVisible: PropTypes.bool,
    toggleArduinoPanel: PropTypes.func,
    vm: PropTypes.instanceOf(VM)
};

GUI.defaultProps = {
    isScratchDesktop: false,
    onStorageInit: storageInstance => storageInstance.addOfficialScratchWebStores(),
    onProjectLoaded: () => {},
    onUpdateProjectId: () => {},
    backpackOptions: {
        host: null,
        visible: false
    },
    basePath: './',
    headerBarProps: {},
    blocksProps: {},
    stageSizeMode: STAGE_SIZE_MODES.large,
    vm: new VM()
};

const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
        alertsVisible: state.scratchGui.alerts.visible,
        backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
        blocksTabVisible: state.scratchGui.editorTab.activeTabIndex === BLOCKS_TAB_INDEX,
        cardsVisible: state.scratchGui.cards.visible,
        connectionModalVisible: state.scratchGui.modals.connectionModal,
        costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
        costumesTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_TAB_INDEX,
        error: state.scratchGui.projectState.error,
        importInfoVisible: state.scratchGui.modals.importInfo,
        isError: getIsError(loadingState),
        isFullScreen: state.scratchGui.mode.isFullScreen,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isRtl: state.locales.isRtl,
        isShowingProject: getIsShowingProject(loadingState),
        loadingStateVisible: state.scratchGui.modals.loadingProject,
        previewInfoVisible: state.scratchGui.modals.previewInfo,
        projectId: state.scratchGui.projectState.projectId,
        soundsTabVisible: state.scratchGui.editorTab.activeTabIndex === SOUNDS_TAB_INDEX,
        targetIsStage: (
            state.scratchGui.targets.stage &&
            state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
        ),
        telemetryModalVisible: state.scratchGui.modals.telemetryModal,
        tipsLibraryVisible: state.scratchGui.modals.tipsLibrary,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = dispatch => ({
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: tab => dispatch(activateTab(tab)),
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX)),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
    onRequestCloseTelemetryModal: () => dispatch(closeTelemetryModal()),
    onUpdateReduxProjectTitle: title => dispatch(setProjectTitle(title))
});

const ConnectedGUI = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps,
)(GUI));

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    LocalizationHOC,
    ErrorBoundaryHOC('Top Level App'),
    FontLoaderHOC,
    QueryParserHOC,
    ProjectFetcherHOC,
    ProjectSaverHOC,
    vmListenerHOC,
    vmManagerHOC,
    cloudManagerHOC
)(ConnectedGUI);

WrappedGui.setAppElement = ReactModal.setAppElement;
export default WrappedGui;