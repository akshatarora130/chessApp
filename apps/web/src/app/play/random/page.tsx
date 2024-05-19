"use client";

import { Chessboard } from "react-chessboard";
import { useSocket } from "../../../hooks/use-socket";
import { useEffect, useState } from "react";
import { Chess, Square } from "chess.js";
import { INIT_GAME, MOVE, GAME_OVER } from "@repo/common";

const Page = () => {
  const socket = useSocket();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.fen());
  const [started, setStarted] = useState(false);
  const [color, setColor] = useState("white");

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message);

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
          console.log("Move made");
          break;
        case GAME_OVER:
          console.log("Game over");
          break;
      }
    };
  }, [socket]);

  if (!socket) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="text-lg font-bold">Connecting...</div>
      </div>
    );
  }

  const onDrop = (sourceSquare: Square, targetSquare: Square, piece: any) => {
    chess.move({
      from: sourceSquare,
      to: targetSquare,
    });
    setBoard(chess.fen());
    socket.send(
      JSON.stringify({
        type: MOVE,
        move: {
          from: sourceSquare,
          to: targetSquare,
        },
      })
    );

    return true;
  };

  const onPlay = () => {
    socket.send(
      JSON.stringify({
        type: INIT_GAME,
      })
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="pt-8 max-w-screen-lg w-full">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 w-full">
          <div className="md:col-span-4 w-full flex justify-center">
            <Chessboard
              position={board}
              boardOrientation={color}
              onPieceDrop={onDrop}
              boardStyle={{ borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)' }}
            />
          </div>
          <div className="md:col-span-2 bg-gray-800 w-full flex flex-col items-center justify-center p-6 rounded-lg shadow-lg">
            {!started && (
              <button
                onClick={onPlay}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition duration-200"
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

