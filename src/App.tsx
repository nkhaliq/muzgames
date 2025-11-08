
import React, { useState, useCallback, useEffect } from 'react';
import type { Player, TriviaPack, PlayerScore, Question } from './types';
import { GameState } from './types';
import { TRIVIA_PACKS, SIMULATED_PLAYERS_DATA, SOUND_EFFECTS } from './constants';
import UserProfileScreen from './components/UserProfileScreen';
import PackSelectionScreen from './components/PackSelectionScreen';
import LobbyScreen from './components/LobbyScreen';
import QuestionScreen from './components/QuestionScreen';
import LeaderboardScreen from './components/LeaderboardScreen';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.PROFILE);
    const [host, setHost] = useState<Player | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [roomCode, setRoomCode] = useState<string>('');
    const [selectedPack, setSelectedPack] = useState<TriviaPack | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [scores, setScores] = useState<PlayerScore[]>([]);

    const resetGame = useCallback(() => {
        setGameState(GameState.PROFILE);
        setHost(null);
        setPlayers([]);
        setRoomCode('');
        setSelectedPack(null);
        setCurrentQuestionIndex(0);
        setScores([]);
    }, []);

    const handleProfileSave = (user: Omit<Player, 'id' | 'isHost'>) => {
        const newHost = { ...user, id: 'host-user', isHost: true };
        setHost(newHost);
        setGameState(GameState.PACK_SELECTION);
    };

    const handlePackSelect = (packId: string) => {
        const pack = TRIVIA_PACKS.find(p => p.id === packId);
        if (pack && host) {
            setSelectedPack(pack);
            const newRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
            setRoomCode(newRoomCode);

            const simulatedPlayers: Player[] = SIMULATED_PLAYERS_DATA.map((p, i) => ({
                ...p,
                id: `sim-${i}`,
                isHost: false,
            }));
            const allPlayers = [host, ...simulatedPlayers];
            setPlayers(allPlayers);
            setScores(allPlayers.map(p => ({ ...p, score: 0, lastAnswerPoints: 0 })));

            setGameState(GameState.LOBBY);
        }
    };
    
    const handleStartGame = () => {
        new Audio(SOUND_EFFECTS.START).play().catch(e => console.error("Error playing sound:", e));
        setGameState(GameState.QUESTION_ACTIVE);
    };

    const handleAnswer = (answerIndex: number, timeTaken: number) => {
        if (!selectedPack) return;

        const currentQuestion = selectedPack.questions[currentQuestionIndex];
        
        // Calculate scores for all players (host + simulated)
        const updatedScores = scores.map(player => {
            let points = 0;
            // Host's answer
            if (player.isHost) {
                if (answerIndex === currentQuestion.correctAnswerIndex) {
                    points = calculatePoints(currentQuestion.points, timeTaken);
                }
            } else { // Simulate answers for bots
                const botAnswersCorrectly = Math.random() > 0.3; // 70% chance of being correct
                if (botAnswersCorrectly) {
                    const botTimeTaken = Math.random() * 10 + 2; // 2-12 seconds
                    points = calculatePoints(currentQuestion.points, botTimeTaken);
                }
            }

            return {
                ...player,
                score: player.score + points,
                lastAnswerPoints: points,
            };
        });

        setScores(updatedScores);
        
        // Transition to leaderboard after a delay to show correct answer
        setTimeout(() => {
            setGameState(GameState.LEADERBOARD);
        }, 2000); 
    };
    
    const calculatePoints = (basePoints: number, timeTaken: number): number => {
        const timeBonus = Math.round(basePoints * (1 - timeTaken / 15 / 2)); // Bonus is up to 50% of base points
        return basePoints + timeBonus;
    };

    const handleNext = () => {
        if (!selectedPack) return;

        if (currentQuestionIndex < selectedPack.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setGameState(GameState.QUESTION_ACTIVE);
        } else {
            setGameState(GameState.GAME_OVER);
        }
    };

    const renderGameState = () => {
        switch (gameState) {
            case GameState.PROFILE:
                return <UserProfileScreen onProfileSave={handleProfileSave} />;
            case GameState.PACK_SELECTION:
                return host && <PackSelectionScreen host={host} onPackSelect={handlePackSelect} />;
            case GameState.LOBBY:
                return <LobbyScreen roomCode={roomCode} players={players} onStartGame={handleStartGame} />;
            case GameState.QUESTION_ACTIVE:
                return selectedPack && (
                    <QuestionScreen
                        question={selectedPack.questions[currentQuestionIndex]}
                        questionNumber={currentQuestionIndex + 1}
                        totalQuestions={selectedPack.questions.length}
                        onAnswer={handleAnswer}
                    />
                );
            case GameState.LEADERBOARD:
                return <LeaderboardScreen scores={scores} isGameOver={false} onNext={handleNext} />;
            case GameState.GAME_OVER:
                return <LeaderboardScreen scores={scores} isGameOver={true} onNext={resetGame} />;
            default:
                return <div>Loading...</div>;
        }
    };

    return <div className="antialiased">{renderGameState()}</div>;
};

export default App;
