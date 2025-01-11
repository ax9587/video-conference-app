// app/lobby/page.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video, Users } from "lucide-react";

interface RoomJoinData {
    email: string;
    room: string;
}

const LobbyScreen = () => {
    const [email, setEmail] = useState<string>("");
    const [room, setRoom] = useState<string>("");

    const socket = useSocket();
    const router = useRouter();

    const handleSubmitForm = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            socket.emit("room:join", { email, room });
        },
        [email, room, socket]
    );

    const handleJoinRoom = useCallback(
        (data: RoomJoinData) => {
            const { room } = data;
            router.push(`/room/${room}`);
        },
        [router]
    );

    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return () => {
            socket.off("room:join", handleJoinRoom);
        };
    }, [socket, handleJoinRoom]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Video className="w-6 h-6 text-blue-500" />
                        <CardTitle className="text-2xl">Video Chat</CardTitle>
                    </div>
                    <CardDescription>
                        Enter your details to join a video chat room
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitForm} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room">Room Code</Label>
                            <Input
                                id="room"
                                placeholder="Enter room code"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            <Users className="mr-2 h-4 w-4" />
                            Join Room
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LobbyScreen;