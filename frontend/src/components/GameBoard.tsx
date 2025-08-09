import React from 'react';
import { Bomb, Gem } from 'lucide-react';

interface GameBoardProps {
  revealedCells: Set<number>;
  mines: Set<number>;
  onCellClick: (cellIndex: number) => void;
  isPlaying: boolean;
  gameResult: 'none' | 'win' | 'loss';
}

const GameBoard: React.FC<GameBoardProps> = ({
  revealedCells,
  mines,
  onCellClick,
  isPlaying,
  gameResult
}) => {
  const renderCell = (index: number) => {
    const isRevealed = revealedCells.has(index);
    const isMine = mines.has(index);
    const isClickable = isPlaying && !isRevealed;
    
    let cellContent = null;
    let cellClass = "w-16 h-16 border border-gray-600 rounded-lg transition-all duration-200 flex items-center justify-center text-lg font-bold cursor-pointer";
    
    if (isRevealed) {
      if (isMine) {
        cellContent = <Bomb className="w-6 h-6 text-red-400" />;
        cellClass += " bg-red-900 border-red-700";
      } else {
        cellContent = <Gem className="w-6 h-6 text-emerald-400" />;
        cellClass += " bg-emerald-900 border-emerald-700";
      }
    } else {
      cellClass += " bg-gray-800 hover:bg-gray-700 border-gray-600";
      if (gameResult === 'loss' && isMine) {
        cellContent = <Bomb className="w-6 h-6 text-red-400" />;
        cellClass = cellClass.replace('bg-gray-800', 'bg-red-900').replace('border-gray-600', 'border-red-700');
      }
    }
    
    if (!isClickable) {
      cellClass = cellClass.replace('cursor-pointer', 'cursor-not-allowed');
    }
    
    return (
      <div
        key={index}
        className={cellClass}
        onClick={() => isClickable && onCellClick(index)}
      >
        {cellContent}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
        {Array.from({ length: 25 }, (_, i) => renderCell(i))}
      </div>
    </div>
  );
};

export default GameBoard;