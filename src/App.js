import React, { Component } from 'react';
import './App.css';
import { Col, Row, Glyphicon } from 'react-bootstrap';
import * as firebase from 'firebase';
import CodeMirror from 'codemirror';
import randomstring from 'randomstring';
import debounce from 'lodash.debounce';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/ruby/ruby';

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  // authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
  // storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
};

class App extends Component{
  constructor() {
    super();
    this.handleCodeKeyUp = this.handleCodeKeyUp.bind(this);
    this.handleLangChange = this.handleLangChange.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleChatKeyUp = this.handleChatKeyUp.bind(this);
    this.state = {
      codeString: '',
      language: 'javascript',
      tabsize: '2',
      chat: []
    };
  }

  handleLangChange(event) {
    var language = event.target.value;
    this.setState({language: language});
    this.codeSession.child('language').set(language);
  }

  handleTabChange(event) {
    this.setState({tabsize: event.target.value});
  }

  handleCodeKeyUp(str) {
    if (this.state.codeString !== str) {
      this.setState({codeString: str});
      this.codeSession.child('codeString').set(str);
      this.codeSession.child('userId').set(this.userId);
    }
  }

  handleChatKeyUp(msg) {
    this.codeSession.child('chat').push().set({
      'user_id': this.userId,
      'text': msg
    });
  }

  componentWillMount() {
    firebase.initializeApp(config);
    var url = window.location;
    var sessionId = '';
    this.userId = randomstring.generate(8);
    //initialize session
    if (url.pathname.length === 1) {
      sessionId = randomstring.generate(16);
      this.codeSession = firebase.database().ref(sessionId);
      this.codeSession.set({
        codeString: '',
        language: this.state.language,
        userId: this.userId,
        chat: []
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

  componentDidMount() {
    this.codeSession.on('value', snapshot => {
      if (snapshot.val().userId !== this.userId) {
        this.setState({codeString: snapshot.val().codeString});
      }
    });
    this.codeSession.child('chat').orderByKey().on('child_added', (snapshot, prevChildKey) => {
      var message = snapshot.val();
      var key = snapshot.getKey()
      this.state.chat.push({
        user_id: message.user_id,
        text: message.text,
        key: key
      });
    });
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <div className="logo">FireMirror</div>
          {/* add button to copy url here (use clipboardjs) */}
          <select value={this.state.language} onChange={this.handleLangChange}>
            <option value="javascript">Javascript</option>
            <option value="python">Python</option>
            <option value="ruby">Ruby</option>
          </select>
          <select value={this.state.tabsize} onChange={this.handleTabChange}>
            <option value="2">Tab Size: 2</option>
            <option value="4">Tab Size: 4</option>
            <option value="8">Tab Size: 8</option>
          </select>
        </div>
        <CodeArea
          codeString={this.state.codeString}
          language={this.state.language}
          tabsize={this.state.tabsize}
          onKeyUp={this.handleCodeKeyUp}
        />
        <ChatArea
          chat={this.state.chat}
          onKeyUp={this.handleChatKeyUp}
        />
      </div>
    );
  }
}

class CodeArea extends Component {
  constructor() {
    super();
    this.getCode = this.getCode.bind(this);
    this.state = {cursor: {line: '0', ch: '0'}}; // remember cursor position on re-render
  }

  getCode() {
    this.setState({cursor: this.codeMirror.getCursor()});
    this.props.onKeyUp(this.codeMirror.getValue());
  }

  componentDidMount() {
    this.codeMirror = CodeMirror(document.getElementById('codeArea'), {
      mode: this.props.language,
      tabSize: this.props.tabsize,
      lineWrapping: true,
      lineNumbers: true,
      indentWithTabs: true
    });
    this.codeMirror.setSize(null, 500);
  }

  componentWillReceiveProps(nextProps) {
    this.codeMirror.setValue(nextProps.codeString);
    this.codeMirror.setCursor(this.state.cursor);
    this.codeMirror.setOption("mode", nextProps.language);
    this.codeMirror.setOption("tabSize", nextProps.tabsize);
  }

  render() {
    return <Col md={8} id='codeArea' onKeyUp={debounce(this.getCode, 500)}></Col>
  }
}

class ChatArea extends Component {
  constructor() {
    super();
    this.sendMessage = this.sendMessage.bind(this);
  }

  sendMessage(event) {
    if (event.key === 'Enter') {
      var msg = event.target.value;
      if (msg !== '') {
        this.props.onKeyUp(msg);
      }
    }
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {

  }

  render() {
    var messages = this.props.chat.map(msg => <p key={msg.key}>{msg.user_id}: {msg.text}</p>);
    return (
      <Col md={4} id='chatArea'>
        <div>
          {messages.length > 0 && messages}
        </div>
        <input type='text' onKeyUp={this.sendMessage}></input>
      </Col>
    )
  }
}

export default App;
