import type { MatchStatus } from '@/types/match';
import type { Category, Difficulty, QuestionType } from '@/types/run';
import type { RoomStatus } from '@/types/room';

/**
 * Supabase requires Row/Insert/Update to satisfy `Record<string, unknown>`.
 * Use type aliases (not interfaces) so the Database schema is accepted.
 */

export type PassageRow = {
  id: string;
  title: string;
  content: string;
  category: Category;
  difficulty: Difficulty;
  word_count: number;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  passage_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  type: QuestionType;
  created_at: string;
};

/** Public quiz payload — never includes correct_answer. */
export type QuestionPublicRow = {
  id: string;
  passage_id: string;
  question: string;
  options: string[];
  type: QuestionType;
  created_at: string;
};

export type RoomRow = {
  id: string;
  room_code: string;
  status: RoomStatus;
  passage_id: string | null;
  host_player_id: string | null;
  created_at: string;
  expires_at: string;
};

export type PlayerRow = {
  id: string;
  room_id: string;
  nickname: string;
  ready: boolean;
  joined_at: string;
  finished: boolean;
  finished_at: string | null;
  reading_time: number | null;
  wpm: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  comprehension: number | null;
  final_score: number | null;
};

export type PlayerSessionRow = {
  id: string;
  player_id: string;
  room_id: string;
  client_id: string;
  session_token: string;
  created_at: string;
};

export type MatchRow = {
  id: string;
  room_id: string;
  passage_id: string | null;
  started_at: string;
  race_start_at: string | null;
  status: MatchStatus;
  completed_at: string | null;
};

export type ResultRow = {
  id: string;
  match_id: string;
  player_id: string;
  reading_time: number;
  wpm: number;
  correct_answers: number;
  total_questions: number;
  comprehension: number;
  final_score: number;
  submitted_at: string;
};

export type GradeAnswerItem = {
  questionId: string;
  selectedIndex: number | null;
  correct: boolean;
  correctAnswerIndex: number;
};

export type GradePassageResult = {
  answers: GradeAnswerItem[];
  correctAnswers: number;
  totalQuestions: number;
};

/** Payload returned by create_room_and_join / join_room RPCs. */
export type RoomJoinResult = {
  room: RoomRow;
  player: PlayerRow;
  session_token: string;
};

export type SetReadyResult = {
  room: RoomRow;
  player: PlayerRow;
};

export type StartMatchResult = {
  room: RoomRow;
  match: MatchRow | null;
  server_now: string;
};

export type AckRaceStartResult = {
  room: RoomRow;
  match: MatchRow | null;
  server_now: string;
};

export type FinishReadingResult = {
  room: RoomRow;
  match: MatchRow | null;
  player: PlayerRow;
  server_now: string;
};

export type SubmitMatchQuizResult = {
  room: RoomRow;
  match: MatchRow | null;
  player: PlayerRow;
  result: ResultRow;
  grade: GradePassageResult | null;
  server_now: string;
};

export type LeaveRoomResult = {
  room: RoomRow;
  closed: boolean;
  host_left: boolean;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      passages: {
        Row: PassageRow;
        Insert: {
          id?: string;
          title: string;
          content: string;
          category: Category;
          difficulty: Difficulty;
          word_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          category?: Category;
          difficulty?: Difficulty;
          word_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: QuestionRow;
        Insert: {
          id?: string;
          passage_id: string;
          question: string;
          options: string[];
          correct_answer: number;
          type: QuestionType;
          created_at?: string;
        };
        Update: {
          id?: string;
          passage_id?: string;
          question?: string;
          options?: string[];
          correct_answer?: number;
          type?: QuestionType;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_passage_id_fkey';
            columns: ['passage_id'];
            isOneToOne: false;
            referencedRelation: 'passages';
            referencedColumns: ['id'];
          },
        ];
      };
      rooms: {
        Row: RoomRow;
        Insert: {
          id?: string;
          room_code: string;
          status?: RoomStatus;
          passage_id?: string | null;
          host_player_id?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          room_code?: string;
          status?: RoomStatus;
          passage_id?: string | null;
          host_player_id?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rooms_passage_id_fkey';
            columns: ['passage_id'];
            isOneToOne: false;
            referencedRelation: 'passages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rooms_host_player_id_fkey';
            columns: ['host_player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      players: {
        Row: PlayerRow;
        Insert: {
          id?: string;
          room_id: string;
          nickname: string;
          ready?: boolean;
          joined_at?: string;
          finished?: boolean;
          finished_at?: string | null;
          reading_time?: number | null;
          wpm?: number | null;
          correct_answers?: number | null;
          total_questions?: number | null;
          comprehension?: number | null;
          final_score?: number | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          nickname?: string;
          ready?: boolean;
          joined_at?: string;
          finished?: boolean;
          finished_at?: string | null;
          reading_time?: number | null;
          wpm?: number | null;
          correct_answers?: number | null;
          total_questions?: number | null;
          comprehension?: number | null;
          final_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'players_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          },
        ];
      };
      player_sessions: {
        Row: PlayerSessionRow;
        Insert: {
          id?: string;
          player_id: string;
          room_id: string;
          client_id: string;
          session_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          room_id?: string;
          client_id?: string;
          session_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_sessions_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: true;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'player_sessions_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          },
        ];
      };
      matches: {
        Row: MatchRow;
        Insert: {
          id?: string;
          room_id: string;
          passage_id?: string | null;
          started_at?: string;
          race_start_at?: string | null;
          status?: MatchStatus;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          passage_id?: string | null;
          started_at?: string;
          race_start_at?: string | null;
          status?: MatchStatus;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_passage_id_fkey';
            columns: ['passage_id'];
            isOneToOne: false;
            referencedRelation: 'passages';
            referencedColumns: ['id'];
          },
        ];
      };
      results: {
        Row: ResultRow;
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          reading_time: number;
          wpm: number;
          correct_answers: number;
          total_questions: number;
          comprehension: number;
          final_score: number;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          reading_time?: number;
          wpm?: number;
          correct_answers?: number;
          total_questions?: number;
          comprehension?: number;
          final_score?: number;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'results_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'results_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      questions_public: {
        Row: QuestionPublicRow;
        Relationships: [
          {
            foreignKeyName: 'questions_passage_id_fkey';
            columns: ['passage_id'];
            isOneToOne: false;
            referencedRelation: 'passages';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      grade_passage_answers: {
        Args: {
          p_passage_id: string;
          p_answers: Json;
        };
        Returns: Json;
      };
      expire_room: {
        Args: {
          p_room_id: string;
        };
        Returns: RoomRow;
      };
      create_room_with_code: {
        Args: {
          p_passage_id?: string | null;
        };
        Returns: RoomRow;
      };
      create_room_and_join: {
        Args: {
          p_nickname: string;
          p_client_id: string;
        };
        Returns: Json;
      };
      join_room: {
        Args: {
          p_room_code: string;
          p_nickname: string;
          p_client_id: string;
        };
        Returns: Json;
      };
      set_player_ready: {
        Args: {
          p_player_id: string;
          p_session_token: string;
          p_ready: boolean;
        };
        Returns: Json;
      };
      start_match: {
        Args: {
          p_room_id: string;
          p_player_id: string;
          p_session_token: string;
        };
        Returns: Json;
      };
      get_server_time: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      ack_race_start: {
        Args: {
          p_room_id: string;
          p_player_id: string;
          p_session_token: string;
        };
        Returns: Json;
      };
      finish_reading: {
        Args: {
          p_match_id: string;
          p_player_id: string;
          p_session_token: string;
        };
        Returns: Json;
      };
      submit_match_quiz: {
        Args: {
          p_match_id: string;
          p_player_id: string;
          p_session_token: string;
          p_answers: Json;
        };
        Returns: Json;
      };
      leave_room: {
        Args: {
          p_player_id: string;
          p_session_token: string;
        };
        Returns: Json;
      };
      get_room_by_code: {
        Args: {
          p_room_code: string;
        };
        Returns: RoomRow;
      };
      generate_room_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      assert_room_active: {
        Args: {
          p_room_id: string;
        };
        Returns: RoomRow;
      };
    };
    Enums: {
      difficulty: Difficulty;
      category: Category;
      room_status: RoomStatus;
      match_status: MatchStatus;
      question_type: QuestionType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
