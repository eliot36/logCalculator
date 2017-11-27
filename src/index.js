import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { DB_CONFIG } from './config';
import * as firebase from 'firebase';



class App extends React.Component {
	constructor(props) {
		super(props);
		
		// Firebase
		this.app = firebase.initializeApp(DB_CONFIG);
		this.calcRef = this.app.database().ref().child('calcDB');

		// Methods
		this.addLog = this.addLog.bind(this);
		this.removeFirstLog = this.removeFirstLog.bind(this);

		// State
		this.state = { log: [] };
	}

	componentWillMount() {
		const prevLog = this.state.log;

		// Add new log in state if log added into db
		this.calcRef.on('child_added', snap => {
			prevLog.push({
				"calc": snap.val(),
				"key": snap.key
			})
			this.setState({ log: prevLog })
		});
		
		// Remove element in state if log deleted from db
		this.calcRef.on('child_removed', snap => {
			this.setState({ log : prevLog.splice(0,1) });
		})
	}


	/* Add new log to db */
	addLog(log) {
		// Remove oldest log, if db has over 10 logs
		(this.state.log.length > 9) && (this.removeFirstLog())
		this.calcRef.push(log);
	}

	/* Remove first log in db by key */
	removeFirstLog() {
		this.calcRef.child(this.state.log[0].key).remove();
	}

	render() {
		return (
			<section id="main">
				<Calculator addLog={this.addLog}/>
				<DisplayLog data={this.state.log}/> 
			</section>
		);
	}
}

class Calculator extends React.Component {
	constructor(props) {
		super(props);
		this.regex = /[+\-*/]/; // +, -, *, /
		this.state = { input: "0", resultFlag: true, dotFlag: false }
	}

	componentDidMount() {
		this.refs.calculatorFrame.focus()
	}

	/* Calculate input */
	calculate () {
		const input = this.state.input;

		// Calculate only if last input is not operator and input contains any operator
		if( (!input.slice(-1).match(this.regex)) && input.match(this.regex) ) {
			try{
				const result = eval(input);
				// Add log into db
				this.props.addLog(input + "=" + result)

				// Clear display
				this.setState({ input: result.toString(), resultFlag: true, dotFlag: false })
			}catch(err){
				// If input is not appropriate for eval, clear
				this.clearInput();
				alert("Invalid Calculation");
			}
		}
	}

	/* Append input into state */
	appendInput (input) {
		let result;
		let existed = this.state.input;

		// Remove initial display value, after init or calculation
		(this.state.resultFlag === true) && (this.setState({resultFlag:false}))
		if (input.match(this.regex)){
			this.setState({dotFlag:false})
		}

		const existed_last = existed.slice(-1);

		// ***0
		if(existed_last === "0"){
			// +0
			if(existed.slice(-2, -1).match(this.regex) && existed.length > 1){
				if (input === "."){
					this.setState({dotFlag:true})
					result = existed + input;
				}else if(input.match(this.regex)){
					result = existed + input;
				}else{
					result = existed.slice(0, existed.length-1) + input;
				}
			}else if(existed.length === 1 && input !== "." && !input.match(this.regex)){
				result = input;
			}else if(input === "." && this.state.dotFlag === true) {
				result = existed;
			}else {
				if(input === ".") {
					this.setState({dotFlag:true})
				}
				result = existed + input;
			}
		}else if(existed_last.match(this.regex)) {
			result =
				(input.match(this.regex)) ? existed.slice(0, existed.length-1) + input
					: (input === ".") ? existed + "0" + input
						: existed + input;
		}else if(existed_last === "."){
			result = (input.match(this.regex)) ? existed.slice(0, existed.length-1) + input : (input === ".") ? existed : existed + input;
		}else if(input === "." && this.state.dotFlag === false) {
			result = existed + input;
			this.setState({ dotFlag:true })
		}else{
			if(input === "." && this.state.dotFlag === true) {
				result = existed;
			}else {
				result = existed + input;
			}
		}
		this.setState({ input: result })

	}

	/* Convert input by click to appendInput parameter */
	inputHandler(e) {
		this.appendInput(e.target.value);
	}

	/* Clear input box */
	clearInput () {
		this.setState({ input: "0", dotFlag: false })
	}

	/* Remove single letter from input box */
	removeInputLetter () {
		const existed = this.state.input;
		let postInput = (existed.length === 1) ? "0" : existed.slice(0, existed.length - 1);
		this.setState({ input: postInput })
	}

	/* Handle keyboard input */
	pressKeyInput (e) {
		const inputLowercase = e.key.toLowerCase();

		if(e.key.match(this.regex) || (e.key.match(/[0-9.]/) && e.key.length === 1)) {
			this.appendInput(e.key.toString());
		}else if(inputLowercase === "c"){
			this.clearInput();
		}else if(inputLowercase === "backspace"){
			this.removeInputLetter();
		}else if(inputLowercase === "enter" || inputLowercase === " " || inputLowercase === "="){
			this.calculate();
		}
	}

	render() {
		return (
			<div id="calculator" ref="calculatorFrame" tabIndex="0" onKeyDown={this.pressKeyInput.bind(this)}>
				<div id="input-box" className="">{this.state.input}</div>
				<div className="btn-group">
					<button className="button" value="C" onClick={this.clearInput.bind(this)}>C</button>
					<button className="button" onClick={this.removeInputLetter.bind(this)}>←</button>
					<button className="button" value="" disabled></button>
					<button className="button" value="/" onClick={this.inputHandler.bind(this)}>÷</button>
				</div>
				<div className="btn-group">
					<button className="button" value="7" onClick={this.inputHandler.bind(this)}>7</button>
					<button className="button" value="8" onClick={this.inputHandler.bind(this)}>8</button>
					<button className="button" value="9" onClick={this.inputHandler.bind(this)}>9</button>
					<button className="button" value="*" onClick={this.inputHandler.bind(this)}>×</button>
				</div>
				<div className="btn-group">
					<button className="button" value="4" onClick={this.inputHandler.bind(this)}>4</button>
					<button className="button" value="5" onClick={this.inputHandler.bind(this)}>5</button>
					<button className="button" value="6" onClick={this.inputHandler.bind(this)}>6</button>
					<button className="button" value="-" onClick={this.inputHandler.bind(this)}>-</button>
				</div>
				<div className="btn-group">
					<button className="button" value="1" onClick={this.inputHandler.bind(this)}>1</button>
					<button className="button" value="2" onClick={this.inputHandler.bind(this)}>2</button>
					<button className="button" value="3" onClick={this.inputHandler.bind(this)}>3</button>
					<button className="button" value="+" onClick={this.inputHandler.bind(this)}>+</button>
				</div>
				<div className="btn-group">
					<button className="button" value="" disabled></button>
					<button className="button" value="0" onClick={this.inputHandler.bind(this)}>0</button>
					 <button className="button" value="." onClick={this.inputHandler.bind(this)}>.</button> 
					{/* <button className="button" value="" disabled></button> */}
					<button className="button" value="" onClick={this.calculate.bind(this)}>=</button>
				</div>
			</div>
		);
	}
}

class DisplayLog extends React.Component {
	render() {
		return (
			<div id="log-box">
			 	{this.props.data.map((data, idx) => {
			 		return (
			 			 <div key={idx} className="logs">{data.calc}</div> 
			 		)
			 	})}
			</div>
		);
	}
}

ReactDOM.render(
	<App/>,
	document.getElementById('root'));
