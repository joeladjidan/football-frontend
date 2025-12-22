export interface Player {
  name: string;
  position: string;
}

export interface PlayerResponse extends Player {
  id?: number;
}

export interface TeamRequest {
  name: string;
  acronym: string;
  budget: number;
  players?: Player[];
}

export interface Team {
  id: number;
  name: string;
  acronym: string;
  budget: number;
  players?: PlayerResponse[];
}
