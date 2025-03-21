import React, { useRef, useEffect } from 'react';
import socket from '../websocketClient';
import './Whiteboard.css'; // Import CSS for styling

const Whiteboard = ({ groupId }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 5;
    contextRef.current = context;

    const startDrawing = ({ nativeEvent }) => {
      const { offsetX, offsetY } = nativeEvent;
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      drawing.current = true;
      socket.send(JSON.stringify({ type: 'group', groupId, data: { type: 'start', x: offsetX, y: offsetY } }));
    };

    const finishDrawing = () => {
      contextRef.current.closePath();
      drawing.current = false;
    };

    const draw = ({ nativeEvent }) => {
      if (!drawing.current) return;
      const { offsetX, offsetY } = nativeEvent;
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      socket.send(JSON.stringify({ type: 'group', groupId, data: { type: 'draw', x: offsetX, y: offsetY } }));
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', finishDrawing);
    canvas.addEventListener('mousemove', draw);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mouseup', finishDrawing);
      canvas.removeEventListener('mousemove', draw);
    };
  }, [groupId]);

  useEffect(() => {
    socket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type === 'group') {
        const { x, y } = data;
        if (data.type === 'start') {
          contextRef.current.beginPath();
          contextRef.current.moveTo(x, y);
        } else if (data.type === 'draw') {
          contextRef.current.lineTo(x, y);
          contextRef.current.stroke();
        }
      }
    };
  }, [groupId]);

  return (
    <div className="whiteboard">
      <h2>Whiteboard</h2>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default Whiteboard;
