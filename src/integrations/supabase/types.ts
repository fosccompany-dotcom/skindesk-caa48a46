export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          notes: string | null
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          notes?: string | null
          role?: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          notes?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      clinic_balances: {
        Row: {
          balance: number
          clinic: string
          clinic_kakao_id: string | null
          id: string
          shop_category: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          clinic: string
          clinic_kakao_id?: string | null
          id?: string
          shop_category?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          clinic?: string
          clinic_kakao_id?: string | null
          id?: string
          shop_category?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clinic_brands: {
        Row: {
          classification: string | null
          crawl_difficulty: string | null
          created_at: string | null
          description: string | null
          event_page_url: string | null
          has_event_kw: boolean | null
          html_chars: number | null
          http_status: number | null
          id: string
          is_active: boolean | null
          last_audit_at: string | null
          name: string
          slug: string | null
          source_version: string | null
          total_branches_kr: number | null
          total_branches_overseas: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          classification?: string | null
          crawl_difficulty?: string | null
          created_at?: string | null
          description?: string | null
          event_page_url?: string | null
          has_event_kw?: boolean | null
          html_chars?: number | null
          http_status?: number | null
          id?: string
          is_active?: boolean | null
          last_audit_at?: string | null
          name: string
          slug?: string | null
          source_version?: string | null
          total_branches_kr?: number | null
          total_branches_overseas?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          classification?: string | null
          crawl_difficulty?: string | null
          created_at?: string | null
          description?: string | null
          event_page_url?: string | null
          has_event_kw?: boolean | null
          html_chars?: number | null
          http_status?: number | null
          id?: string
          is_active?: boolean | null
          last_audit_at?: string | null
          name?: string
          slug?: string | null
          source_version?: string | null
          total_branches_kr?: number | null
          total_branches_overseas?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      clinic_events: {
        Row: {
          brand_id: string | null
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_pct: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          location_id: string | null
          source_type: string | null
          source_url: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location_id?: string | null
          source_type?: string | null
          source_url?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location_id?: string | null
          source_type?: string | null
          source_url?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "clinic_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_admin_locations_brand"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "clinic_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brand_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_admin_locations_brand"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "clinic_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_kakao_no_match"
            referencedColumns: ["location_id"]
          },
        ]
      }
      clinic_locations: {
        Row: {
          address: string | null
          branch_name: string
          brand_id: string
          business_hours: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_overseas: boolean | null
          kakao_backfill_status: string | null
          kakao_place_id: string | null
          landmark: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          region_gugun: string | null
          region_sido: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          branch_name: string
          brand_id: string
          business_hours?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_overseas?: boolean | null
          kakao_backfill_status?: string | null
          kakao_place_id?: string | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          region_gugun?: string | null
          region_sido?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          branch_name?: string
          brand_id?: string
          business_hours?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_overseas?: boolean | null
          kakao_backfill_status?: string | null
          kakao_place_id?: string | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          region_gugun?: string | null
          region_sido?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_locations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "clinic_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_locations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_admin_locations_brand"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "clinic_locations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brand_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_treatments: {
        Row: {
          body_areas: string[] | null
          branch_note: string | null
          brand_id: string | null
          catalog_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          discount_pct: number | null
          effective_from: string
          effective_to: string | null
          effects: string[] | null
          id: string
          location_id: string | null
          original_price_krw: number | null
          package_option_id: string | null
          price_krw: number | null
          price_range_text: string | null
          price_unit: string | null
          raw_text: string | null
          source_type: string | null
          source_url: string | null
          treatment_name: string
          updated_at: string | null
        }
        Insert: {
          body_areas?: string[] | null
          branch_note?: string | null
          brand_id?: string | null
          catalog_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_pct?: number | null
          effective_from?: string
          effective_to?: string | null
          effects?: string[] | null
          id?: string
          location_id?: string | null
          original_price_krw?: number | null
          package_option_id?: string | null
          price_krw?: number | null
          price_range_text?: string | null
          price_unit?: string | null
          raw_text?: string | null
          source_type?: string | null
          source_url?: string | null
          treatment_name: string
          updated_at?: string | null
        }
        Update: {
          body_areas?: string[] | null
          branch_note?: string | null
          brand_id?: string | null
          catalog_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_pct?: number | null
          effective_from?: string
          effective_to?: string | null
          effects?: string[] | null
          id?: string
          location_id?: string | null
          original_price_krw?: number | null
          package_option_id?: string | null
          price_krw?: number | null
          price_range_text?: string | null
          price_unit?: string | null
          raw_text?: string | null
          source_type?: string | null
          source_url?: string | null
          treatment_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_treatments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "clinic_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_treatments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_admin_locations_brand"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "clinic_treatments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brand_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_treatments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_treatments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_admin_locations_brand"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "clinic_treatments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_kakao_no_match"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "clinic_treatments_package_option_id_fkey"
            columns: ["package_option_id"]
            isOneToOne: false
            referencedRelation: "package_options"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_snapshots: {
        Row: {
          id: string
          notes: string | null
          score_a: number | null
          score_h: number | null
          score_i: number | null
          score_o: number | null
          score_p: number | null
          snapshot_at: string
          source: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          score_a?: number | null
          score_h?: number | null
          score_i?: number | null
          score_o?: number | null
          score_p?: number | null
          snapshot_at?: string
          source?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          score_a?: number | null
          score_h?: number | null
          score_i?: number | null
          score_o?: number | null
          score_p?: number | null
          snapshot_at?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      package_options: {
        Row: {
          category: string
          category_en: string | null
          category_zh: string | null
          created_at: string | null
          id: string
          is_default: boolean
          name: string
          name_en: string | null
          name_zh: string | null
          package_id: string | null
          sort_order: number | null
          sub_type: string | null
        }
        Insert: {
          category: string
          category_en?: string | null
          category_zh?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean
          name: string
          name_en?: string | null
          name_zh?: string | null
          package_id?: string | null
          sort_order?: number | null
          sub_type?: string | null
        }
        Update: {
          category?: string
          category_en?: string | null
          category_zh?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          name_en?: string | null
          name_zh?: string | null
          package_id?: string | null
          sort_order?: number | null
          sub_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_options_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "treatment_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          charged_amount: number | null
          clinic: string
          clinic_district: string | null
          clinic_kakao_id: string | null
          clinic_type: string | null
          created_at: string | null
          date: string
          id: string
          memo: string | null
          method: string | null
          record_type: string | null
          shop_category: string | null
          treatment_name: string
          user_id: string
        }
        Insert: {
          amount?: number
          charged_amount?: number | null
          clinic: string
          clinic_district?: string | null
          clinic_kakao_id?: string | null
          clinic_type?: string | null
          created_at?: string | null
          date: string
          id?: string
          memo?: string | null
          method?: string | null
          record_type?: string | null
          shop_category?: string | null
          treatment_name: string
          user_id: string
        }
        Update: {
          amount?: number
          charged_amount?: number | null
          clinic?: string
          clinic_district?: string | null
          clinic_kakao_id?: string | null
          clinic_type?: string | null
          created_at?: string | null
          date?: string
          id?: string
          memo?: string | null
          method?: string | null
          record_type?: string | null
          shop_category?: string | null
          treatment_name?: string
          user_id?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          balance: number
          clinic: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          package_id: string | null
          payment_record_id: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance: number
          clinic?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          package_id?: string | null
          payment_record_id?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance?: number
          clinic?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          package_id?: string | null
          payment_record_id?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "treatment_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_payment_record_id_fkey"
            columns: ["payment_record_id"]
            isOneToOne: false
            referencedRelation: "payment_records"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          body_area: string | null
          clinic: string
          clinic_address: string | null
          clinic_district: string | null
          clinic_kakao_id: string | null
          created_at: string | null
          date: string
          id: string
          memo: string | null
          skin_layer: string | null
          time: string | null
          treatment_name: string
          user_id: string
        }
        Insert: {
          body_area?: string | null
          clinic: string
          clinic_address?: string | null
          clinic_district?: string | null
          clinic_kakao_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          memo?: string | null
          skin_layer?: string | null
          time?: string | null
          treatment_name: string
          user_id: string
        }
        Update: {
          body_area?: string | null
          clinic?: string
          clinic_address?: string | null
          clinic_district?: string | null
          clinic_kakao_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          memo?: string | null
          skin_layer?: string | null
          time?: string | null
          treatment_name?: string
          user_id?: string
        }
        Relationships: []
      }
      treatment_cycles: {
        Row: {
          body_area: string | null
          clinic: string
          clinic_district: string | null
          clinic_kakao_id: string | null
          created_at: string | null
          cycle_days: number
          id: string
          is_custom_cycle: boolean | null
          last_treatment_date: string
          notes: string | null
          product: string | null
          shop_category: string | null
          skin_layer: string | null
          treatment_name: string
          user_id: string
        }
        Insert: {
          body_area?: string | null
          clinic: string
          clinic_district?: string | null
          clinic_kakao_id?: string | null
          created_at?: string | null
          cycle_days: number
          id?: string
          is_custom_cycle?: boolean | null
          last_treatment_date: string
          notes?: string | null
          product?: string | null
          shop_category?: string | null
          skin_layer?: string | null
          treatment_name: string
          user_id: string
        }
        Update: {
          body_area?: string | null
          clinic?: string
          clinic_district?: string | null
          clinic_kakao_id?: string | null
          created_at?: string | null
          cycle_days?: number
          id?: string
          is_custom_cycle?: boolean | null
          last_treatment_date?: string
          notes?: string | null
          product?: string | null
          shop_category?: string | null
          skin_layer?: string | null
          treatment_name?: string
          user_id?: string
        }
        Relationships: []
      }
      treatment_packages: {
        Row: {
          body_area: string | null
          clinic: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          name: string
          point_transaction_id: string | null
          purchase_price: number | null
          shop_category: string | null
          skin_layer: string | null
          total_sessions: number | null
          type: string | null
          used_sessions: number | null
          user_id: string
        }
        Insert: {
          body_area?: string | null
          clinic?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          name: string
          point_transaction_id?: string | null
          purchase_price?: number | null
          shop_category?: string | null
          skin_layer?: string | null
          total_sessions?: number | null
          type?: string | null
          used_sessions?: number | null
          user_id: string
        }
        Update: {
          body_area?: string | null
          clinic?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          name?: string
          point_transaction_id?: string | null
          purchase_price?: number | null
          shop_category?: string | null
          skin_layer?: string | null
          total_sessions?: number | null
          type?: string | null
          used_sessions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_packages_point_transaction_id_fkey"
            columns: ["point_transaction_id"]
            isOneToOne: false
            referencedRelation: "point_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_records: {
        Row: {
          amount_paid: number | null
          axis_weights: Json | null
          body_area: string | null
          clinic: string
          clinic_address: string | null
          clinic_district: string | null
          clinic_kakao_id: string | null
          created_at: string | null
          date: string
          id: string
          input_method: string | null
          memo: string | null
          notes: string | null
          package_id: string | null
          package_uuid: string | null
          payment_amount: number | null
          payment_method: string | null
          satisfaction: number | null
          shop_category: string | null
          shots: number | null
          skin_layer: string | null
          treatment_id: string | null
          treatment_name: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          axis_weights?: Json | null
          body_area?: string | null
          clinic: string
          clinic_address?: string | null
          clinic_district?: string | null
          clinic_kakao_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          input_method?: string | null
          memo?: string | null
          notes?: string | null
          package_id?: string | null
          package_uuid?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          satisfaction?: number | null
          shop_category?: string | null
          shots?: number | null
          skin_layer?: string | null
          treatment_id?: string | null
          treatment_name: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          axis_weights?: Json | null
          body_area?: string | null
          clinic?: string
          clinic_address?: string | null
          clinic_district?: string | null
          clinic_kakao_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          input_method?: string | null
          memo?: string | null
          notes?: string | null
          package_id?: string | null
          package_uuid?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          satisfaction?: number | null
          shop_category?: string | null
          shots?: number | null
          skin_layer?: string | null
          treatment_id?: string | null
          treatment_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_records_package_uuid_fkey"
            columns: ["package_uuid"]
            isOneToOne: false
            referencedRelation: "treatment_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_clinics: {
        Row: {
          clinic_brand_id: string
          created_at: string
          id: string
          priority: number
          user_id: string
        }
        Insert: {
          clinic_brand_id: string
          created_at?: string
          id?: string
          priority: number
          user_id: string
        }
        Update: {
          clinic_brand_id?: string
          created_at?: string
          id?: string
          priority?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_clinics_clinic_brand_id_fkey"
            columns: ["clinic_brand_id"]
            isOneToOne: false
            referencedRelation: "clinic_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_clinics_clinic_brand_id_fkey"
            columns: ["clinic_brand_id"]
            isOneToOne: false
            referencedRelation: "v_admin_locations_brand"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "user_favorite_clinics_clinic_brand_id_fkey"
            columns: ["clinic_brand_id"]
            isOneToOne: false
            referencedRelation: "v_brand_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_clinics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          age_group: string | null
          avatar_color: string | null
          birth_date: string | null
          bloom_stage: number
          concerns: string[] | null
          created_at: string | null
          current_season: string | null
          deleted_at: string | null
          diagnosis_updated_at: string | null
          email: string | null
          goals: string[] | null
          id: string
          name: string | null
          privacy_agreed_at: string | null
          quiz_completed_at: string | null
          regions: string[] | null
          score_a: number | null
          score_h: number | null
          score_i: number | null
          score_o: number | null
          score_p: number | null
          skin_goal: string | null
          skin_tribe: string | null
          skin_type: string | null
          target_areas: string[] | null
          total_log_count: number
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          avatar_color?: string | null
          birth_date?: string | null
          bloom_stage?: number
          concerns?: string[] | null
          created_at?: string | null
          current_season?: string | null
          deleted_at?: string | null
          diagnosis_updated_at?: string | null
          email?: string | null
          goals?: string[] | null
          id: string
          name?: string | null
          privacy_agreed_at?: string | null
          quiz_completed_at?: string | null
          regions?: string[] | null
          score_a?: number | null
          score_h?: number | null
          score_i?: number | null
          score_o?: number | null
          score_p?: number | null
          skin_goal?: string | null
          skin_tribe?: string | null
          skin_type?: string | null
          target_areas?: string[] | null
          total_log_count?: number
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          avatar_color?: string | null
          birth_date?: string | null
          bloom_stage?: number
          concerns?: string[] | null
          created_at?: string | null
          current_season?: string | null
          deleted_at?: string | null
          diagnosis_updated_at?: string | null
          email?: string | null
          goals?: string[] | null
          id?: string
          name?: string | null
          privacy_agreed_at?: string | null
          quiz_completed_at?: string | null
          regions?: string[] | null
          score_a?: number | null
          score_h?: number | null
          score_i?: number | null
          score_o?: number | null
          score_p?: number | null
          skin_goal?: string | null
          skin_tribe?: string | null
          skin_type?: string | null
          target_areas?: string[] | null
          total_log_count?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_admin_locations_brand: {
        Row: {
          address: string | null
          branch_name: string | null
          brand_id: string | null
          brand_name: string | null
          classification: string | null
          crawl_difficulty: string | null
          created_at: string | null
          is_active: boolean | null
          kakao_backfill_status: string | null
          kakao_place_id: string | null
          location_id: string | null
          region_gugun: string | null
          region_sido: string | null
        }
        Relationships: []
      }
      v_brand_summary: {
        Row: {
          actual_locations: number | null
          classification: string | null
          crawl_difficulty: string | null
          id: string | null
          kakao_matched: number | null
          kakao_pending: number | null
          name: string | null
          pending_events: number | null
          published_events: number | null
          total_branches_kr: number | null
          treatment_records: number | null
          website: string | null
        }
        Relationships: []
      }
      v_kakao_no_match: {
        Row: {
          branch_name: string | null
          brand: string | null
          classification: string | null
          location_id: string | null
          region_gugun: string | null
          region_sido: string | null
          website: string | null
        }
        Relationships: []
      }
      v_pending_review_events: {
        Row: {
          branch_name: string | null
          brand_name: string | null
          created_at: string | null
          description: string | null
          discount_pct: number | null
          end_date: string | null
          event_id: string | null
          source_type: string | null
          source_url: string | null
          start_date: string | null
          title: string | null
        }
        Relationships: []
      }
      v_searchable_treatments: {
        Row: {
          body_areas: string[] | null
          branch_name: string | null
          branch_note: string | null
          brand_classification: string | null
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          catalog_id: string | null
          category: string | null
          description: string | null
          discount_pct: number | null
          effective_from: string | null
          effects: string[] | null
          location_id: string | null
          original_price_krw: number | null
          price_krw: number | null
          price_range_text: string | null
          region_gugun: string | null
          region_sido: string | null
          source_type: string | null
          treatment_id: string | null
          treatment_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_treatments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "clinic_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_treatments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_admin_locations_brand"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "clinic_treatments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brand_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_treatments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_treatments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_admin_locations_brand"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "clinic_treatments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_kakao_no_match"
            referencedColumns: ["location_id"]
          },
        ]
      }
    }
    Functions: {
      compute_bloom_stage: { Args: { log_count: number }; Returns: number }
      debug_vault_access: { Args: never; Returns: Json }
      fn_expire_clinic_events: { Args: never; Returns: Json }
      fn_run_crawl_cron: { Args: never; Returns: Json }
      fn_run_kakao_backfill_cron: {
        Args: { p_batch_size?: number }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      review_clinic_event: {
        Args: { p_action: string; p_event_id: string }
        Returns: Json
      }
      search_treatments: {
        Args: {
          p_body_areas?: string[]
          p_brand_slug?: string
          p_category?: string
          p_effects?: string[]
          p_limit?: number
          p_offset?: number
          p_only_with_price?: boolean
          p_query?: string
          p_region_sido?: string
        }
        Returns: {
          body_areas: string[]
          branch_name: string
          branch_note: string
          brand_id: string
          brand_name: string
          brand_slug: string
          catalog_id: string
          category: string
          description: string
          discount_pct: number
          effects: string[]
          original_price_krw: number
          price_krw: number
          price_range_text: string
          region_gugun: string
          region_sido: string
          total_count: number
          treatment_id: string
          treatment_name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
