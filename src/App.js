import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// import { Col, Row } from 'react-bootstrap';
import * as firebase from 'firebase';
import CodeMirror from 'codemirror';
import randomstring from 'randomstring';

class App extends Component{
  constructor() {
    super();
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  initializeApi() {
    firebase.initializeApp(config);
    var url = window.location;
    var sessionId = '';
    var userId = randomstring.generate(16);
    //initialize session
    if (url.pathname.length === 1) {
      sessionId = randomstring.generate();
      this.codeSession = firebase.database().ref(sessionId);
      this.codeSession.set({code: '', language: '', userId: userId});
      history.pushState(null, null, '/'+sessionId);
    // join session
    } else {
      sessionId = url.pathname.slice(1, -1);
      this.codeSession = firebase.database().ref(sessionId);
    }
  }

  handleKeyUp(str) {
    console.log('handleKeyUp: ', str);
  }

  componentWillMount() {
    this.initializeApi();
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <CodeArea codeSession={this.codeSession} onKeyUp={this.handleKeyUp}/>
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
    this.codeMirror = CodeMirror(document.getElementById('codeArea'), { lineWrapping: true });
  }

  render() {
    return <div id='codeArea' onKeyUp={this.getCode}></div>
  }
}

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOM,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJ_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STOR_BUCKET
};

export default App;
