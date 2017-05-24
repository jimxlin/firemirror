import React, { Component } from 'react';
import './App.css';
import { Col } from 'react-bootstrap';
import * as firebase from 'firebase';
import CodeMirror from 'codemirror';
import randomstring from 'randomstring';
import debounce from 'lodash.debounce';

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
};

class App extends Component{
  constructor() {
    super();
    this.handleCodeKeyUp = this.handleCodeKeyUp.bind(this);
    this.handleLangChange = this.handleLangChange.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleWordwrapChange = this.handleWordwrapChange.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.handleChatKeyPress = this.handleChatKeyPress.bind(this);
    this.state = {
      codeString: '',
      language: 'markdown',
      tabsize: '2',
      wordwrap: 'true',
      theme: 'monokai',
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

  handleWordwrapChange(event) {
    this.setState({wordwrap: event.target.value});
  }

  handleThemeChange(event) {
    this.setState({theme: event.target.value});
  }

  handleCodeKeyUp(str) {
    if (this.state.codeString !== str) {
      this.setState({codeString: str});
      this.codeSession.child('codeString').set(str);
      this.codeSession.child('userId').set(this.userId);
    }
  }

  handleChatKeyPress(msg) {
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
          <div className="options">
            <select value={this.state.language} onChange={this.handleLangChange}>
              <option value="text/x-csrc">C</option>
              <option value="text/x-c++src">C++</option>
              <option value="text/x-csharp">C#</option>
              <option value="htmlmixed">HTML</option>
              <option value="text/x-java">Java</option>
              <option value="javascript">Javascript</option>
              <option value="markdown">Markdown</option>
              <option value="python">Python</option>
              <option value="ruby">Ruby</option>
              <option value="text/x-sql">SQL</option>
            </select>
            <select value={this.state.theme} onChange={this.handleThemeChange}>
              <option value="default">Default</option>
              <option value="eclipse">Eclipse</option>
              <option value="solarized">Solarized</option>
              <option value="yeti">Yeti</option>
              <option value="monokai">Monokai</option>
              <option value="dracula">Dracula</option>
              <option value="cobalt">Cobalt</option>
              <option value="blackboard">Blackboard</option>
            </select>
            <select value={this.state.tabsize} onChange={this.handleTabChange}>
              <option value="2">Tab Size: 2</option>
              <option value="4">Tab Size: 4</option>
              <option value="8">Tab Size: 8</option>
            </select>
            <select value={this.state.wordwrap} onChange={this.handleWordwrapChange}>
              <option value="true">Word Wrap: On</option>
              <option value="false">Word Wrap: Off</option>
            </select>
          </div>
        </div>
        <CodeArea
          codeString={this.state.codeString}
          language={this.state.language}
          tabsize={this.state.tabsize}
          wordwrap={this.state.wordwrap}
          theme={this.state.theme}
          onKeyUp={this.handleCodeKeyUp}
        />
        <ChatArea
          chat={this.state.chat}
          onKeyPress={this.handleChatKeyPress}
        />
      </div>
    );
  }
}

class CodeArea extends Component {
  constructor() {
    super();
    this.getCode = this.getCode.bind(this);
    this.state = {cursor: {line: '0', ch: '0'}};
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
      indentWithTabs: true,
      theme: 'monokai',
      value: '# Firemirror \nThis is a realtime collaborative document, just share this URL to start collaborating!'
    });
    this.codeMirror.setSize(null, "100%");
  }

  componentWillReceiveProps(nextProps) {
    this.codeMirror.setValue(nextProps.codeString);
    this.codeMirror.setCursor(this.state.cursor);
    this.codeMirror.setOption("mode", nextProps.language);
    this.codeMirror.setOption("tabSize", nextProps.tabsize);
    this.codeMirror.setOption("lineWrapping", nextProps.wordwrap === 'true');
    this.codeMirror.setOption("theme", nextProps.theme);
  }

  render() {
    return <Col id='codeArea'
                xs={8} sm={9} md={10}
                onKeyUp={debounce(this.getCode, 500)}>
            </Col>
  }
}

class ChatArea extends Component {
  constructor() {
    super();
    this.sendMessage = this.sendMessage.bind(this);
  }

  sendMessage(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      var msg = event.target.value;
      if (msg !== '') {
        this.props.onKeyPress(msg);
        this.textInput.value = '';
      }
    }
  }

  componentDidUpdate() {
    this.viewChat.scrollTop = this.viewChat.scrollHeight;
  }

  render() {
    var messages = this.props.chat.map(msg => <p key={msg.key}><b>{msg.user_id}</b>: {msg.text}</p>);
    return (
      <Col id='chatArea' xs={4} sm={3} md={2}>
        <div className="view-chat" ref={view => this.viewChat = view}>
          <div className="chat-header"><b>Chatroom</b></div>
          {messages.length > 0 && messages}
        </div>
        <textarea onKeyPress={this.sendMessage} ref={input => this.textInput = input}></textarea>
      </Col>
    )
  }
}

export default App;
