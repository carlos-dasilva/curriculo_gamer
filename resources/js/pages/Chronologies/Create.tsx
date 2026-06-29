import React from 'react';
import ChronologyForm, { type GameOption } from './ChronologyForm';

type Props = {
  games: GameOption[];
};

export default function ChronologyCreate({ games }: Props) {
  return <ChronologyForm mode="create" games={games} />;
}
