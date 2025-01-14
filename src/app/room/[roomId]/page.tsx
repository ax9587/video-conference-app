// app/room/[roomId]/page.tsx
"use client";

import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "@/service/peer";
import { useSocket } from "@/context/SocketProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Video,
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserJoinedData {
    email: string;
    id: string;
}

interface CallData {
    from: string;
    offer: RTCSessionDescriptionInit;
}

interface CallAcceptedData {
    from: string;
    ans: RTCSessionDescriptionInit;
}

interface NegoData {
    from: string;
    offer: RTCSessionDescriptionInit;
}

interface NegoFinalData {
    ans: RTCSessionDescriptionInit;
}

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
    const [myStream, setMyStream] = useState<MediaStream>();
    const [remoteStream, setRemoteStream] = useState<MediaStream>();
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isCallInitiator, setIsCallInitiator] = useState(false);

    const handleUserJoined = useCallback(({ email, id }: UserJoinedData) => {
        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        const offer = await peer.getOffer();
        if (remoteSocketId && offer) {
            socket.emit("start-call", { to: remoteSocketId, offer });
            setIsCallInitiator(true);
        }
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const handleIncommingCall = useCallback(
        async ({ from, offer }: CallData) => {
            setRemoteSocketId(from);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMyStream(stream);
            console.log(`Incoming Call`, from, offer);
            const ans = await peer.getAnswer(offer);
            if (ans) {
                socket.emit("answer", { to: from, ans });
                // Automatically send streams when accepting an incoming call
                setIsCallInitiator(false);
                // We need to wait for the peer connection to be established
                /*  setTimeout(() => {
                     if (stream) {
                         for (const track of stream.getTracks()) {
                             peer.peer?.addTrack(track, stream);
                         }
                     }
                 }, 1000); */
            }
        },
        [socket]
    );

    const sendStreams = useCallback(() => {
        if (!myStream || !peer.peer) return;
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream);
        }
    }, [myStream]);

    const handleCallAccepted = useCallback(
        ({ from, ans }: CallAcceptedData) => {
            peer.setLocalDescription(ans);
            console.log("Call Accepted!");
            // Only send streams if we initiated the call
            if (isCallInitiator) {
                sendStreams();
            }
        },
        [sendStreams, isCallInitiator]
    );

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        if (remoteSocketId && offer) {
            socket.emit("peer-nego-needed", { offer, to: remoteSocketId });
        }
    }, [remoteSocketId, socket]);

    useEffect(() => {
        if (!peer.peer) return;
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            if (!peer.peer) return;
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    const handleNegoNeedIncomming = useCallback(
        async ({ from, offer }: NegoData) => {
            const ans = await peer.getAnswer(offer);
            if (ans) {
                socket.emit("peer-nego-done", { to: from, ans });
            }
        },
        [socket]
    );

    const handleNegoNeedFinal = useCallback(async ({ ans }: NegoFinalData) => {
        await peer.setLocalDescription(ans);
    }, []);

    useEffect(() => {
        if (!peer.peer) return;
        peer.peer.addEventListener("track", async (ev: RTCTrackEvent) => {
            const remoteStream = ev.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);

    useEffect(() => {
        socket.on("user-joined", handleUserJoined);
        socket.on("offer", handleIncommingCall);
        socket.on("answer", handleCallAccepted);
        socket.on("peer-nego-needed", handleNegoNeedIncomming);
        socket.on("peer-nego-final", handleNegoNeedFinal);

        return () => {
            socket.off("user-joined", handleUserJoined);
            socket.off("offer", handleIncommingCall);
            socket.off("answer", handleCallAccepted);
            socket.off("peer-nego-needed", handleNegoNeedIncomming);
            socket.off("peer-nego-final", handleNegoNeedFinal);
        };
    }, [
        socket,
        handleUserJoined,
        handleIncommingCall,
        handleCallAccepted,
        handleNegoNeedIncomming,
        handleNegoNeedFinal,
    ]);
    const toggleAudio = useCallback(() => {
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioEnabled(audioTrack.enabled);
        }
    }, [myStream]);

    const toggleVideo = useCallback(() => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(videoTrack.enabled);
        }
    }, [myStream]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Video className="w-6 h-6 text-blue-500" />
                        <h1 className="text-2xl font-bold">Video Chat Room</h1>
                    </div>
                    <Badge variant={remoteSocketId ? "default" : "secondary"}>
                        {remoteSocketId ? "Connected" : "Waiting for peer"}
                    </Badge>
                </div>

                {!remoteSocketId && (
                    <Alert>
                        <AlertDescription>
                            Waiting for someone to join. Share this room link with others to start a video chat.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myStream && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Your Stream</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative rounded-lg overflow-hidden bg-black">
                                    <ReactPlayer
                                        playing
                                        muted
                                        height="300px"
                                        width="100%"
                                        url={myStream}
                                        className="aspect-video"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {remoteStream && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Remote Stream</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative rounded-lg overflow-hidden bg-black">
                                    <ReactPlayer
                                        playing
                                        height="300px"
                                        width="100%"
                                        url={remoteStream}
                                        className="aspect-video"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white rounded-full shadow-lg p-4 flex items-center space-x-4">
                        {myStream && (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleAudio}
                                    className={!isAudioEnabled ? "bg-red-100" : ""}
                                >
                                    {isAudioEnabled ? (
                                        <Mic className="h-4 w-4" />
                                    ) : (
                                        <MicOff className="h-4 w-4 text-red-500" />
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleVideo}
                                    className={!isVideoEnabled ? "bg-red-100" : ""}
                                >
                                    {isVideoEnabled ? (
                                        <VideoIcon className="h-4 w-4" />
                                    ) : (
                                        <VideoOff className="h-4 w-4 text-red-500" />
                                    )}
                                </Button>
                                {/* Only show send streams button for call initiator */}
                                {isCallInitiator && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={sendStreams}
                                    >
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                        {!isCallInitiator && remoteSocketId && myStream && (
                            <Button
                                onClick={sendStreams}
                                className="bg-green-500 hover:bg-green-600"
                            >
                                <Phone className="mr-2 h-4 w-4" />
                                Answer Call
                            </Button>
                        )}
                        {remoteSocketId && !myStream && (
                            <Button
                                onClick={handleCallUser}
                                className="bg-green-500 hover:bg-green-600"
                            >
                                <Phone className="mr-2 h-4 w-4" />
                                Start Call
                            </Button>
                        )}
                        {myStream && (
                            <Button
                                variant="destructive"
                                onClick={() => window.location.href = '/lobby'}
                            >
                                <PhoneOff className="mr-2 h-4 w-4" />
                                End Call
                            </Button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RoomPage;
