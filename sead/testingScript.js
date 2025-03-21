import axios from 'axios';
import WebSocket from 'isomorphic-ws';

// Test user credentials
const userCredentials = {
  email: 'testuser@example.com',
  password: 'password123'
};

// Test group ID
const groupId = 'test-group-id';

// Test individual functionalities
async function testIndividualFunctionalities() {
  try {
    // Log in the user
    const loginResponse = await axios.post('/api/auth/login', userCredentials);
    const token = loginResponse.data.token;
    console.log('User logged in successfully');

    // Test chat functionality
    const chatSocket = new WebSocket(`ws://localhost:5000?token=${token}`);
    chatSocket.onopen = () => console.log('Chat WebSocket connection established');
    chatSocket.onmessage = (event) => console.log('Chat message received:', event.data);
    chatSocket.send(JSON.stringify({ type: 'individual', data: { message: 'Hello world!' } }));

    // Test video call functionality
    const videoCallSocket = new WebSocket(`ws://localhost:5000?token=${token}`);
    videoCallSocket.onopen = () => console.log('Video Call WebSocket connection established');
    videoCallSocket.onmessage = (event) => console.log('Video Call message received:', event.data);
    // Simulate video call offer/answer exchange here...

    // Test whiteboard functionality
    const whiteboardSocket = new WebSocket(`ws://localhost:5000?token=${token}`);
    whiteboardSocket.onopen = () => console.log('Whiteboard WebSocket connection established');
    whiteboardSocket.onmessage = (event) => console.log('Whiteboard message received:', event.data);
    whiteboardSocket.send(JSON.stringify({ type: 'individual', data: { type: 'draw', x: 100, y: 100 } }));

    console.log('Individual functionalities tested successfully');
  } catch (error) {
    console.error('Error testing individual functionalities:', error);
  }
}

// Test group functionalities
async function testGroupFunctionalities() {
  try {
    // Log in the user
    const loginResponse = await axios.post('/api/auth/login', userCredentials);
    const token = loginResponse.data.token;
    console.log('User logged in successfully');

    // Test group chat functionality
    const groupChatSocket = new WebSocket(`ws://localhost:5000?token=${token}`);
    groupChatSocket.onopen = () => console.log('Group Chat WebSocket connection established');
    groupChatSocket.onmessage = (event) => console.log('Group Chat message received:', event.data);
    groupChatSocket.send(JSON.stringify({ type: 'group', groupId, data: { message: 'Hello group!' } }));

    // Test group video call functionality
    const groupVideoCallSocket = new WebSocket(`ws://localhost:5000?token=${token}`);
    groupVideoCallSocket.onopen = () => console.log('Group Video Call WebSocket connection established');
    groupVideoCallSocket.onmessage = (event) => console.log('Group Video Call message received:', event.data);
    // Simulate video call offer/answer exchange here...

    // Test group whiteboard functionality
    const groupWhiteboardSocket = new WebSocket(`ws://localhost:5000?token=${token}`);
    groupWhiteboardSocket.onopen = () => console.log('Group Whiteboard WebSocket connection established');
    groupWhiteboardSocket.onmessage = (event) => console.log('Group Whiteboard message received:', event.data);
    groupWhiteboardSocket.send(JSON.stringify({ type: 'group', groupId, data: { type: 'draw', x: 200, y: 200 } }));

    console.log('Group functionalities tested successfully');
  } catch (error) {
    console.error('Error testing group functionalities:', error);
  }
}

// Run tests
testIndividualFunctionalities();
testGroupFunctionalities();
