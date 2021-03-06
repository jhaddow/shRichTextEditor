import React from 'react';
import ReactQuill from 'react-quill';
import ShCore from 'sh-core';
import * as _ from 'lodash';
import './sh-rich-text-editor.scss';


class ShRichTextEditor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: '',
            classList: {
                shRichTextEditor: true,
                empty: true,
                focused: false,
                showRequired: false,
                prompt: true
            },
            validStatus: 'unknown'
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeSelection = this.handleChangeSelection.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.validate = this.validate.bind(this);
    }

    validate(onSubmit) {
        if (onSubmit) {
            this.state.classList.shTouched = true;
        }
        let rtn = {isValid: true};

        this.state.classList.shInvalid = false;

        if (this.props.required && this.isEmpty()) {
            this.state.classList.shInvalid = true;

            rtn.isValid = false;
            rtn.msg = 'Required';
        }
        var newState = _.clone(this.state);
        this.setState(newState);
        return rtn;
    };

    componentWillMount() {
        if (this.props.validator) {
            this.props.validator.register(this, this.validate);
        }
    };

    componentWillUnmount() {
        if (this.props.validator) {
            this.props.validator.unregister(this);
        }
    };

    componentWillReceiveProps(props) {
        if (!_.isUndefined(props.value) && !_.isEqual(props.value, this.state.value)) {
            var newState = _.clone(this.state);
            newState.classList.empty = this.isEmpty();
            newState.classList.prompt = this.isEmpty();
            newState.value = props.value;
            this.setState(newState, this.validate);
        }
    };

    componentDidMount() {
        if ((this.props.value) && (this.props.value !== '')) {
            this.setState(
                {
                    value: this.props.value,
                    classList: {
                        shRichTextEditor: true,
                        showRequired: this.props.required
                    }
                }
            );
        } else {
            this.setState(
                {
                    value: this.props.value,
                    classList: {
                        shRichTextEditor: true,
                        empty: true,
                        prompt: true,
                        showRequired: this.props.required
                    }
                }
            );
        }
    };

    handleChange(value) {
        this.setState({value: value}, ()=> {
            if (this.props.validator) {
                this.props.validator.validate();
            } else {
                this.validate();
            }
        });
        this.props.onChange(value);
    };

    handleChangeSelection(range, oldRange, source) {
        this.props.onChangeSelection(range, oldRange, source);
    };

    handleFocus(event) {
        this.props.onFocus(event);
        var newState = _.clone(this.state);
        newState.classList.shTouched = true;
        newState.classList.focused = true;
        newState.classList.prompt = false;
        this.setState(newState);
        if(!_.isUndefined(this.refs.quill)) {
            this.refs.quill.focus();
        }
    };

    handleBlur(event) {
        this.validate();
        this.props.onBlur(event);
        var newState = _.clone(this.state);
        newState.classList.empty = this.isEmpty();
        newState.classList.focused = false;
        newState.classList.showRequired = (this.isEmpty() && this.props.required);
        newState.classList.prompt = this.isEmpty();
        this.setState(newState);
        if(!_.isUndefined(this.refs.quill)) {
            this.refs.quill.blur();
        }
    };

    handleKeyUp(event) {
        var newState = _.clone(this.state);
        newState.classList.empty = this.isEmpty();
        newState.classList.showRequired = (this.isEmpty() && this.props.required);
        this.setState(newState);
    };

    getEditor() {
        return this.refs.quill.getEditor();
    };

    clearText() {
        var newState = _.clone(this.state);
        newState.value = '';
        this.setState(newState);
        let defaultText = this.setDefaultStyle('', this.props.toolbarItems);
        this.getEditor().setHTML(defaultText);
    };

    getText() {
        return this.getEditor().getHTML();
    };

    isEmpty() {
        return ((this.state.value === '') || (this.state.value === '<div></div>') || (this.state.value === '<div><br></div>'));
    };

    setDefaultStyle(value, toolbarItems) {
        let { defaultFont, defaultFontSize } = this.props;

        if (this.isEmpty()) {
            let defaultText = '<div style="';
            if (defaultFont !== '') {
                defaultText += 'font-family: ' + defaultFont + ';';
                toolbarItems[0].items[0].items.forEach(element => {
                    element.selected = (element.label === defaultFont);
                });
            }
            if (defaultFontSize !== '') {
                defaultText += 'font-size: ' + defaultFontSize + ';';
                toolbarItems[0].items[2].items.forEach(element => {
                    element.selected = (element.label === defaultFontSize);
                });
            }
            defaultText += '"><br></div>';
            return defaultText;
        }
        return value;
    };

    render() {
        var {
            value,
            label,
            onFocus,
            onBlur,
            required,
            toolbarItems,
            ...other
        } = this.props;

        value = this.setDefaultStyle(value, toolbarItems);

        return (
            <div id="react-quill-editor" className={this.props.className ? ShCore.getClassNames(this.state.classList) + ' ' + this.props.className : ShCore.getClassNames(this.state.classList)}>
                <ReactQuill ref="quill"
                    className="sh-rich-text-editor-quill"
                    {...other}
                    theme="snow"
                    onChange={this.handleChange}
                    onChangeSelection={this.handleChangeSelection}
                >
                    <ReactQuill.Toolbar
                        key="toolbar"
                        ref="toolbar"
                        items={toolbarItems} 
                    />
                    <div className="quill-contents-label">
                        <span className="label">{label}</span>
                        <span className="required-label">required</span>
                    </div>
                    <div
                        key="editor"
                        ref="editor"
                        className="quill-contents"
                        dangerouslySetInnerHTML={{ __html: value }}
                        onFocus={this.handleFocus}
                        onBlur={this.handleBlur}
                        onKeyUp={this.handleKeyUp}
                        tabIndex="0"
                    />
                </ReactQuill>
            </div>
        );
    };
}

function getToolbarConfig() {

  let toolbar = _.cloneDeep(ReactQuill.Toolbar.defaultItems);

  let fontsToAdd = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Impact', value: 'Impact, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Calibri', value: 'Calibri, san-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' }
  ].sort(function (a, b) {
    return a.label > b.label;
  })

  toolbar[0].items[0].items = [
    ...toolbar[0].items[0].items,
    ...fontsToAdd
  ];

  //remove link option
  toolbar[1].items.pop();

  //remove image option
  toolbar.pop();

  return toolbar;
}

ShRichTextEditor.propTypes = {
  value: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  onChange: React.PropTypes.func.isRequired,
  onChangeSelection: React.PropTypes.func,
  onFocus: React.PropTypes.func,
  toolbarItems: React.PropTypes.array,
  validator: React.PropTypes.object,
  required: React.PropTypes.bool,
  defaultFont: React.PropTypes.string,
  defaultFontSize: React.PropTypes.string
}

ShRichTextEditor.defaultProps = {
    validator: null,
    onChange: _.noop,
    onChangeSelection: _.noop,
    onFocus: _.noop,
    onBlur: _.noop,
    label: '',
    toolbarItems: getToolbarConfig(),
    required: false,
    defaultFont: '',
    defaultFontSize: ''
}

export default ShRichTextEditor;