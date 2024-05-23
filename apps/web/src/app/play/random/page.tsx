"use client";

import React, { useEffect, useState, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { useSocket } from "../../../hooks/use-socket";
import { Chess, Square } from "chess.js";
import { INIT_GAME, MOVE, GAME_OVER } from "@repo/common";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-xl w-full max-w-md mx-4 min-h-56 flex flex-col justify-between">
        <div className="flex-grow mb-6">
          {children}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-white text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-200 transition duration-300"
        >
          Play again
        </button>
      </div>
    </div>
  );
};

const Page = () => {
  const socket = useSocket();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.fen());
  const [started, setStarted] = useState(false);
  const [color, setColor] = useState("white");
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  const [currentTurn, setCurrentTurn] = useState("w");
  const [moves, setMoves] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message); switch (message.type) {
          case INIT_GAME:
            setBoard(chess.fen());
            setStarted(true);
            setColor(message.payload.color);
            setMoves([]);
            setGameOver(false);
            setWinner("");
            break;
          case MOVE:
            const move = message.payload;
            chess.move(move);
            setBoard(chess.fen());
            setCurrentTurn(chess.turn());
            setMoves((prevMoves) => [...prevMoves, move]);
            if (chess.isGameOver()) {
              handleGameOver();
            }
            break;
          case GAME_OVER:
            setGameOver(true);
            setWinner(message.payload);
            clearInterval(timerRef.current)
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
    if (started && !gameOver) {
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
  }, [started, whiteTime, blackTime, gameOver]);


  if (!socket) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Connecting...</div>;
  }

  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    const move = chess.move({ from: sourceSquare, to: targetSquare });
    if (move) {
      setBoard(chess.fen());
      socket.send(JSON.stringify({ type: MOVE, move: { from: sourceSquare, to: targetSquare } }));
      setCurrentTurn(chess.turn());
      setMoves((prevMoves) => [...prevMoves, move]);
      return true;
    }
    return false;
  };

  const onPlay = () => {
    console.log("Starting new game..."); // Debug log
    socket.send(JSON.stringify({ type: INIT_GAME }));
    setWhiteTime(300);
    setBlackTime(300);
    setGameOver(false);
    setWinner("");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const playAgain = () => {
    window.location.href = "/play/random"
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="pt-8 max-w-screen-lg w-full">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 w-full">
          <div className="md:col-span-4 w-full flex flex-col items-center">
            <div className="text-center bg-gray-800 p-2 rounded w-full">
              {color === "white" ? `Black: ${formatTime(blackTime)}` : `White: ${formatTime(whiteTime)}`}
            </div>
            <Chessboard
              position={board}
              boardOrientation={color}
              onPieceDrop={onDrop}
              boardStyle={{ borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)" }}
            />
            <div className="text-center bg-gray-800 p-2 rounded w-full">
              {color === "white" ? `White: ${formatTime(whiteTime)}` : `Black: ${formatTime(blackTime)}`}
            </div>
          </div>
          <div className="md:col-span-2 bg-gray-800 w-full flex flex-col items-end justify-end p-6 rounded-lg shadow-lg">
            {!started && (
              <button
                className="bg-amber-800 border border-red-400 border-b-4 font-medium overflow-hidden relative px-4 py-2 rounded-md hover:brightness-150 hover:border-t-4 hover:border-b active:opacity-75 outline-none duration-300 group min-w-full"
                onClick={onPlay}
              >
                <span className="bg-red-400 shadow-red-400 absolute -top-[150%] left-0 inline-flex w-80 h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]"></span>
                Play
              </button>
            )}
            {started && !gameOver && (
              <div className="w-full h-full overflow-y-scroll max-h-96">
                <h2 className="text-xl font-bold mb-4">Moves</h2>
                <ul className="space-y-2">
                  {moves.map((move, index) => (
                    <li key={index} className="bg-gray-700 p-2 rounded">
                      {`${index + 1}. ${move.from} to ${move.to}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal isOpen={gameOver} onClose={playAgain}>
        <h2 className="text-2xl font-bold mb-4">{winner}</h2>
      </Modal>
    </div>
  );
};

export default Page;

