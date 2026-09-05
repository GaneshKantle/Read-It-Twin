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
  reading_time: number | null;
  wpm: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  comprehension: number | null;
  final_score: number | null;
};

export type MatchRow = {
  id: string;
  room_id: string;
  passage_id: string | null;
  started_at: string;
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
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          room_code?: string;
          status?: RoomStatus;
          passage_id?: string | null;
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
      matches: {
        Row: MatchRow;
        Insert: {
          id?: string;
          room_id: string;
          passage_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          passage_id?: string | null;
          started_at?: string;
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
      question_type: QuestionType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
