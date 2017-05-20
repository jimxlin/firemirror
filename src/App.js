import React, { Component } from 'react';
import './App.css';
import { Col, Row, Glyphicon } from 'react-bootstrap';
import * as firebase from 'firebase';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/python/python'
import 'codemirror/mode/ruby/ruby'
import randomstring from 'randomstring';
import debounce from 'lodash.debounce';

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  //authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOM,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
  //projectId: process.env.REACT_APP_FIREBASE_PROJ_ID,
  //storageBucket: process.env.REACT_APP_FIREBASE_STOR_BUCKET
};

class App extends Component{
  constructor() {
    super();
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleLangChange = this.handleLangChange.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.state = {
      codeString: '',
      language: 'javascript',
      tabsize: '2',
    };
  }

  initializeApi() {
    firebase.initializeApp(config);
    var url = window.location;
    var sessionId = '';
    this.userId = randomstring.generate(16);
    //initialize session
    if (url.pathname.length === 1) {
      sessionId = randomstring.generate();
      this.codeSession = firebase.database().ref(sessionId);
      this.codeSession.set({
        codeString: '',
        language: this.state.language,
        userId: this.userId
      });
      window.history.pushState(null, null, '/'+sessionId);
    // join session
    } else {
      sessionId = url.pathname.slice(1);
      this.codeSession = firebase.database().ref(sessionId);
      this.codeSession.once('value').then(snapshot => {
        this.setState({
          codeString: snapshot.val().codeString,
          language: snapshot.val().language
        });
      });
    }
  }

  handleLangChange(event) {
    var language = event.target.value
    this.setState({language: language});
    this.codeSession.child('language').set(language);
  }

  handleTabChange(event) {
    this.setState({tabsize: event.target.value});
  }

  handleKeyUp(str) {
    if (this.state.codeString != str) {
      this.setState({codeString: str})
    }
    this.codeSession.child('codeString').set(str);
    this.codeSession.child('userId').set(this.userId);
  }

  componentWillMount() {
    this.initializeApi();
  }

  componentDidMount() {
    this.codeSession.on('value', snapshot => {
      if (snapshot.val().userId !== this.userId) {
        this.setState({codeString: snapshot.val().codeString});
      }
    });
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <div className="logo">RTCE_REPL</div>
          {/* add button to copy url here (use clipboardjs) */}
          <select value={this.state.language} onChange={this.handleLangChange}>
              <option value="javascript">Javascript</option>
              <option value="python">Python</option>
              <option value="ruby">Ruby</option>
          </select>
          <select value={this.state.tabsize} onChange={this.handleTabChange}>
            <option value="2">Tabsize: 2</option>
            <option value="4">Tabsize: 4</option>
            <option value="8">Tabsize: 8</option>
          </select>
          <button className="runCode">Run<Glyphicon glyph="play" /></button>
        </div>
        <CodeArea
          codeString={this.state.codeString}
          language={this.state.language}
          tabsize={this.state.tabsize}
          onKeyUp={this.handleKeyUp}/>
      </div>
    );
  }
}



class CodeArea extends Component {
  constructor() {
    super();
    this.getCode = this.getCode.bind(this);
    this.state = {cursor: {line: '0', ch: '0'}} // remember cursor position on re-render
  }

  getCode() {
    this.setState({cursor: this.codeMirror.getCursor()})
    this.props.onKeyUp(this.codeMirror.getValue())
  }

  componentDidMount() {
    this.codeMirror = CodeMirror(document.getElementById('codeArea'), {
      mode: this.props.language,
      tabSize: this.props.tabsize,
      lineWrapping: true,
      lineNumbers: true,
      indentWithTabs: true
    });
  }

  componentWillReceiveProps(nextProps) {
    this.codeMirror.setValue(nextProps.codeString);
    this.codeMirror.setCursor(this.state.cursor);
    this.codeMirror.setOption("mode", nextProps.language);
    this.codeMirror.setOption("tabSize", nextProps.tabsize);
  }

  render() {
    return <div id='codeArea' onKeyUp={debounce(this.getCode, 500)}></div>
  }
}

export default App;
