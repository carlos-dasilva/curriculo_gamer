import React from 'react';
import ChronologyForm, { type ChronologyFormData, type GameOption } from './ChronologyForm';

type Props = {
  games: GameOption[];
  chronology: {
    id: number;
    name: string;
    description?: string | null;
    status: 'avaliacao' | 'liberado';
    steps: ChronologyFormData['steps'];
  };
  abilities?: {
    canApprove?: boolean;
    canEdit?: boolean;
  };
};

export default function ChronologyEdit({ games, chronology, abilities }: Props) {
  return <ChronologyForm mode="edit" games={games} chronology={chronology} abilities={abilities} />;
}
