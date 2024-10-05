import React, { useEffect, useState } from 'react';
import { socket } from './socket';

const App: React.FC = () => {
	const [message, setMessage] = useState<string>('');
	const [messages, setMessages] = useState<string[]>([]);

	useEffect(() => {
		socket.on('message', (data: string) => {
			setMessages((prevMessages) => [...prevMessages, data]);
		});

		return () => {
			socket.off('message');
		};
	}, []);

	const sendMessage = () => {
		socket.emit('message', message);
		setMessage('');
	};

	return (
		<div>
			<h1>Socket.IO Chat</h1>
			<div>
				{messages.map((msg, index) => (
					<p key={index}>{msg}</p>
				))}
			</div>
			<input
				type='text'
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				placeholder='Type a message'
			/>
			<button onClick={sendMessage}>Send</button>
		</div>
	);
};

export default App;
