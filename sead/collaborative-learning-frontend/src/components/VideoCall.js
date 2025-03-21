import React, { useRef, useEffect } from 'react';
import './VideoCall.css'; // Import CSS for styling

const VideoCall = ({ groupId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    const startVideoCall = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = localStream;

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

      peerConnection.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to the server to be forwarded to the remote peer
      socket.send(JSON.stringify({ type: 'group', groupId, data: { offer } }));

      socket.onmessage = async (event) => {
        const { type, data } = JSON.parse(event.data);
        if (type === 'group' && data.answer) {
          await peerConnection.setRemoteDescription(data.answer);
        }
      };
    };

    startVideoCall();

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [groupId]);

  return (
    <div className="video-call">
      <h2>Video Call</h2>
      <video ref={localVideoRef} autoPlay playsInline muted className="local-video"></video>
      <video ref={remoteVideoRef} autoPlay playsInline className="remote-video"></video>
    </div>
  );
};

export default VideoCall;
