// Generated to mirror the live schema in supabase/migrations/. Normally
// produced by `supabase gen types typescript`, but that command needs Docker
// for its internal codegen step — written by hand instead, verified column
// by column against the migrations actually pushed to the hosted project.
// Regenerate with the CLI once Docker is available locally, and diff against
// this file rather than trusting either source blindly.

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
      profiles: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
      places: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          latitude: number;
          longitude: number;
          /** PostGIS geography(Point, 4326), generated from latitude/longitude. No client-side type for this — read latitude/longitude instead. */
          geog: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          latitude: number;
          longitude: number;
          // geog is `generated always as (...) stored` — Postgres rejects an
          // insert/update that names it, so it's intentionally absent here.
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string | null;
          latitude?: number;
          longitude?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "places_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          item_type: string;
          name: string;
          payload: Json;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          item_type: string;
          name: string;
          payload?: Json;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          item_type?: string;
          name?: string;
          payload?: Json;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
      entries: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          entry_type: string;
          occurred_at: string;
          status: Database["public"]["Enums"]["entry_status"];
          visibility: Database["public"]["Enums"]["entry_visibility"];
          rating: number | null;
          notes: string | null;
          tags: string[];
          item_id: string | null;
          place_id: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          entry_type: string;
          occurred_at?: string;
          status?: Database["public"]["Enums"]["entry_status"];
          visibility?: Database["public"]["Enums"]["entry_visibility"];
          rating?: number | null;
          notes?: string | null;
          tags?: string[];
          item_id?: string | null;
          place_id?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          entry_type?: string;
          occurred_at?: string;
          status?: Database["public"]["Enums"]["entry_status"];
          visibility?: Database["public"]["Enums"]["entry_visibility"];
          rating?: number | null;
          notes?: string | null;
          tags?: string[];
          item_id?: string | null;
          place_id?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
          {
            foreignKeyName: "entries_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entries_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          byte_size: number | null;
          position: number;
          entry_id: string | null;
          item_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          byte_size?: number | null;
          position?: number;
          entry_id?: string | null;
          item_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          storage_path?: string;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          byte_size?: number | null;
          position?: number;
          entry_id?: string | null;
          item_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
          {
            foreignKeyName: "media_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      user_modules: {
        Row: {
          user_id: string;
          module_id: string;
          enabled: boolean;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          module_id: string;
          enabled?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          module_id?: string;
          enabled?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_modules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
      entry_links: {
        Row: {
          id: string;
          user_id: string;
          source_type: Database["public"]["Enums"]["linkable_type"];
          source_id: string;
          target_type: Database["public"]["Enums"]["linkable_type"];
          target_id: string;
          relation: Database["public"]["Enums"]["link_relation"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: Database["public"]["Enums"]["linkable_type"];
          source_id: string;
          target_type: Database["public"]["Enums"]["linkable_type"];
          target_id: string;
          relation: Database["public"]["Enums"]["link_relation"];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: Database["public"]["Enums"]["linkable_type"];
          source_id?: string;
          target_type?: Database["public"]["Enums"]["linkable_type"];
          target_id?: string;
          relation?: Database["public"]["Enums"]["link_relation"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entry_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
          // source_id/target_id are deliberately not foreign keys — they're
          // polymorphic across entries/items/places (design D6).
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // Trigger functions (set_updated_at, handle_new_user) are not
      // SQL-callable and are omitted — PostgREST doesn't expose them as RPCs.
      is_friend: {
        Args: { other_user: string };
        Returns: boolean;
      };
    };
    Enums: {
      entry_status: "planned" | "in_progress" | "done";
      entry_visibility: "private" | "friends" | "public";
      linkable_type: "entry" | "item" | "place";
      link_relation: "with" | "at" | "inspired-by";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// --- Convenience accessors (mirrors what `supabase gen types` emits) ---

type PublicSchema = Database["public"];

export type Tables<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];
