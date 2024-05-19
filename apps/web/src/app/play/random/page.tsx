"use client";

import React, { useEffect, useState, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { useSocket } from "../../../hooks/use-socket";
import { Chess, Square } from "chess.js";
import { INIT_GAME, MOVE, GAME_OVER } from "@repo/common";

const Page = () => {
  const socket = useSocket();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.fen());
  const [started, setStarted] = useState(false);
  const [color, setColor] = useState("white");
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  const [currentTurn, setCurrentTurn] = useState("w");
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case INIT_GAME:
            setBoard(chess.fen());
            setStarted(true);
            setColor(message.payload.color);
            break;
          case MOVE:
            const move = message.payload;
            chess.move(move);
            setBoard(chess.fen());
            setCurrentTurn(chess.turn());
            break;
          case GAME_OVER:
            clearInterval(timerRef.current);
            break;
          default:
            console.warn("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
  }, [socket, chess]);

  useEffect(() => {
    if (started) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentTurn((prev) => {
          const newTime = prev === "w" ? whiteTime - 1 : blackTime - 1;
          if (prev === "w") setWhiteTime(newTime);
          else setBlackTime(newTime);
          return prev;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started, whiteTime, blackTime]);

  if (!socket) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Connecting...</div>;
  }

  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    chess.move({ from: sourceSquare, to: targetSquare });
    setBoard(chess.fen());
    socket.send(JSON.stringify({ type: MOVE, move: { from: sourceSquare, to: targetSquare } }));
    setCurrentTurn(chess.turn());
    return true;
  };

  const onPlay = () => {
    socket.send(JSON.stringify({ type: INIT_GAME }));
    setWhiteTime(300);
    setBlackTime(300);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="pt-8 max-w-screen-lg w-full">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 w-full">
          <div className="md:col-span-4 w-full flex flex-col items-center">
            <div className="text-center bg-gray-800 p-2 rounded w-full">
              {color == "white" ? `Black: ${formatTime(blackTime)}` : `White: ${formatTime(whiteTime)}`}
            </div>
            <Chessboard
              position={board}
              boardOrientation={color}
              onPieceDrop={onDrop}
              boardStyle={{ borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)" }}
            />
            <div className="text-center bg-gray-800 p-2 rounded w-full">
              {color == "white" ? `White: ${formatTime(whiteTime)}` : `Black: ${formatTime(blackTime)}`}
            </div>
          </div>
          <div className="md:col-span-2 bg-gray-800 w-full flex flex-col items-center justify-center p-6 rounded-lg shadow-lg">
            {!started && (
              <button
                onClick={onPlay}
                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition duration-200"
              >
                Play
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
