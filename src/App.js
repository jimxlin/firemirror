import React, { Component } from 'react';
import './App.css';
import { Col, Row } from 'react-bootstrap';
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
    this.state = {codeString: '', language: 'javascript'}
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
        this.setState({codeString: snapshot.val().codeString});
      });
    }
  }

  handleKeyUp(str) {
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
          <div className="logo">FiREPL</div>
          <select className="syntax">
              <option>Javascript</option>
              <option>Python</option>
              <option>Ruby</option>
          </select>
          <select className="tabsize">
            <option>Tabsize: 2</option>
            <option>Tabsize: 4</option>
            <option>Tabsize: 8</option>
          </select>
          <button className="runCode">Run</button>
          <div className="App-run"></div>
        </div>
        <CodeArea codeString={this.state.codeString} onKeyUp={this.handleKeyUp}/>
      </div>
    );
  }
}



class CodeArea extends Component {
  constructor() {
    super();
    this.getCode = this.getCode.bind(this);
  }

  getCode() {
    this.props.onKeyUp(this.codeMirror.getValue())
  }

  componentDidMount() {
    this.codeMirror = CodeMirror(document.getElementById('codeArea'), { mode: 'javascript', lineWrapping: true, tabSize: 2, lineNumbers: true });
  }

  componentWillReceiveProps(nextProps) {
    this.codeMirror.setValue(nextProps.codeString);
  }

  render() {
    return <div id='codeArea' onKeyUp={debounce(this.getCode, 500)}></div>
  }
}

export default App;
