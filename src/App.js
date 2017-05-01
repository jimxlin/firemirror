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
    this.state = {code: 'somestring'};
    // this.callback = this.callback.bind(this); // this function will detect changes in text
  }

  componentDidMount() {
    this.initializeApi();
  }

  initializeApi() {
    firebase.initializeApp(config);

    var url = window.location;
    var token = '';
    if (url.pathname.length === 1) {
      token = randomstring.generate();
      url.pathname = token;
    } else {
      token = url.pathname.slice(1, -1);
    }

    this.codeSession = firebase.database().ref(token)
    this.codeSession.set('codetext');
    this.codeMirror = CodeMirror(document.getElementById('codeArea'), { lineWrapping: true });
  }

  render() {
    // this.codeSession is accessible
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <CodeArea codeSession={this.codeSession} />
      </div>
    );
  }
}

class CodeArea extends Component {
  constructor() {
    super();

  }
  render() {
    return <div id='codeArea'></div>
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
