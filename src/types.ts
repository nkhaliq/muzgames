
export interface Question {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
}

export interface TriviaPack {
  id: string;
  title: string;
  description: string;
  color: string;
  questions: Question[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

export interface PlayerScore extends Player {
    score: number;
    lastAnswerPoints: number;
}

export enum GameState {
  PROFILE,
  PACK_SELECTION,
  LOBBY,
  QUESTION_INTRO,
  QUESTION_ACTIVE,
  QUESTION_REVEAL,
  LEADERBOARD,
  GAME_OVER,
}
