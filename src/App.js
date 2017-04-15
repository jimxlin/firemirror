import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as firebase from "firebase";
import * as Firepad from "firepad";
import * as CodeMirror from "codemirror";

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

// Initialize Firebase
const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL
};
firebase.initializeApp(config);

// Get Firebase Database reference.
const firepadRef = firebase.database().ref();

// Create CodeMirror (with lineWrapping on).
const codeMirror = CodeMirror(document.getElementById('firepad'), { lineWrapping: true });

// Create Firepad (with rich text toolbar and shortcuts enabled).
const firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
    { richTextShortcuts: true, richTextToolbar: true, defaultText: 'Hello, World!' });

export default App;
