// Generated from Supabase schema (manual - CLI needs auth token)
// Run `npx supabase gen types typescript --project-id tkwplrhkgfncprvezplk` after login to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          client_id: string
          name: string
          start_date: string | null
          end_date: string | null
          pillar_allocation: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          start_date?: string | null
          end_date?: string | null
          pillar_allocation?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          start_date?: string | null
          end_date?: string | null
          pillar_allocation?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      content_assets: {
        Row: {
          id: string
          client_id: string
          campaign_id: string | null
          title: string
          description: string | null
          content_pillar: Database['public']['Enums']['content_pillar_enum']
          funnel_stage: Database['public']['Enums']['funnel_stage_enum']
          raw_assets_url: string | null
          status: Database['public']['Enums']['asset_status_enum']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          campaign_id?: string | null
          title: string
          description?: string | null
          content_pillar: Database['public']['Enums']['content_pillar_enum']
          funnel_stage: Database['public']['Enums']['funnel_stage_enum']
          raw_assets_url?: string | null
          status?: Database['public']['Enums']['asset_status_enum']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          campaign_id?: string | null
          title?: string
          description?: string | null
          content_pillar?: Database['public']['Enums']['content_pillar_enum']
          funnel_stage?: Database['public']['Enums']['funnel_stage_enum']
          raw_assets_url?: string | null
          status?: Database['public']['Enums']['asset_status_enum']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_assets_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'content_assets_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      platform_posts: {
        Row: {
          id: string
          client_id: string
          asset_id: string | null
          platform: Database['public']['Enums']['platform_enum']
          format: Database['public']['Enums']['post_format_enum']
          visual_hook: string | null
          body_content: string | null
          call_to_action: string | null
          status: Database['public']['Enums']['post_status_enum']
          scheduled_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          asset_id?: string | null
          platform: Database['public']['Enums']['platform_enum']
          format: Database['public']['Enums']['post_format_enum']
          visual_hook?: string | null
          body_content?: string | null
          call_to_action?: string | null
          status?: Database['public']['Enums']['post_status_enum']
          scheduled_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          asset_id?: string | null
          platform?: Database['public']['Enums']['platform_enum']
          format?: Database['public']['Enums']['post_format_enum']
          visual_hook?: string | null
          body_content?: string | null
          call_to_action?: string | null
          status?: Database['public']['Enums']['post_status_enum']
          scheduled_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'platform_posts_asset_id_fkey'
            columns: ['asset_id']
            isOneToOne: false
            referencedRelation: 'content_assets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'platform_posts_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      content_campaigns: {
        Row: {
          id: string
          client_id: string
          name: string
          type: 'campaign' | 'promo' | 'event'
          start_date: string | null
          end_date: string | null
          color: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          type: 'campaign' | 'promo' | 'event'
          start_date?: string | null
          end_date?: string | null
          color?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          type?: 'campaign' | 'promo' | 'event'
          start_date?: string | null
          end_date?: string | null
          color?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_campaigns_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      post_metrics: {
        Row: {
          id: string
          post_id: string
          client_id: string
          platform: string
          views: number
          reach: number
          likes: number
          comments: number
          shares: number
          saves: number
          clicks: number
          wa_inquiries: number
          dm_inquiries: number
          theme_tag: string | null
          comment_details: Json | null
          sentiment_summary: Json | null
          recorded_at: string
        }
        Insert: {
          id?: string
          post_id: string
          client_id: string
          platform: string
          views?: number
          reach?: number
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          clicks?: number
          wa_inquiries?: number
          dm_inquiries?: number
          theme_tag?: string | null
          comment_details?: Json | null
          sentiment_summary?: Json | null
          recorded_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          client_id?: string
          platform?: string
          views?: number
          reach?: number
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          clicks?: number
          wa_inquiries?: number
          dm_inquiries?: number
          theme_tag?: string | null
          comment_details?: Json | null
          sentiment_summary?: Json | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_metrics_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'scheduled_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_metrics_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      analytics_summaries: {
        Row: {
          id: string
          client_id: string
          campaign_tag: string | null
          period_start: string
          period_end: string
          ai_insight: string
          total_reach: number
          total_engagement: number
          total_wa_inquiries: number
          total_dm_inquiries: number
          operator_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          campaign_tag?: string | null
          period_start: string
          period_end: string
          ai_insight: string
          total_reach?: number
          total_engagement?: number
          total_wa_inquiries?: number
          total_dm_inquiries?: number
          operator_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          campaign_tag?: string | null
          period_start?: string
          period_end?: string
          ai_insight?: string
          total_reach?: number
          total_engagement?: number
          total_wa_inquiries?: number
          total_dm_inquiries?: number
          operator_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'analytics_summaries_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      clients: {
        Row: {
          id: string
          name: string
          contact_email: string | null
          contact_phone: string | null
          telegram_chat_id: string | null
          telegram_username: string | null
          telegram_notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email?: string | null
          contact_phone?: string | null
          telegram_chat_id?: string | null
          telegram_username?: string | null
          telegram_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_email?: string | null
          contact_phone?: string | null
          telegram_chat_id?: string | null
          telegram_username?: string | null
          telegram_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          role: 'admin' | 'client'
          client_id: string | null
          full_name: string | null
          avatar_url: string | null
          telegram_chat_id: string | null
          telegram_username: string | null
          telegram_notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'client'
          client_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          telegram_chat_id?: string | null
          telegram_username?: string | null
          telegram_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'client'
          client_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          telegram_chat_id?: string | null
          telegram_username?: string | null
          telegram_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      deliverables: {
        Row: {
          id: string
          client_id: string
          type: 'brief' | 'content' | 'report'
          title: string
          content_md: string
          external_link: string | null
          status: 'draft' | 'sent' | 'approved' | 'revision_requested'
          campaign_tag: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          sent_at: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          type: 'brief' | 'content' | 'report'
          title: string
          content_md?: string
          external_link?: string | null
          status?: 'draft' | 'sent' | 'approved' | 'revision_requested'
          campaign_tag?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          sent_at?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          type?: 'brief' | 'content' | 'report'
          title?: string
          content_md?: string
          external_link?: string | null
          status?: 'draft' | 'sent' | 'approved' | 'revision_requested'
          campaign_tag?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          sent_at?: string | null
          approved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'deliverables_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deliverables_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deliverables_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          id: string
          deliverable_id: string
          user_id: string
          content_md: string
          created_at: string
        }
        Insert: {
          id?: string
          deliverable_id: string
          user_id: string
          content_md: string
          created_at?: string
        }
        Update: {
          id?: string
          deliverable_id?: string
          user_id?: string
          content_md?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_deliverable_id_fkey'
            columns: ['deliverable_id']
            isOneToOne: false
            referencedRelation: 'deliverables'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      status_history: {
        Row: {
          id: string
          deliverable_id: string
          from_status: string | null
          to_status: string
          changed_by: string
          created_at: string
        }
        Insert: {
          id?: string
          deliverable_id: string
          from_status?: string | null
          to_status: string
          changed_by: string
          created_at?: string
        }
        Update: {
          id?: string
          deliverable_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'status_history_deliverable_id_fkey'
            columns: ['deliverable_id']
            isOneToOne: false
            referencedRelation: 'deliverables'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'status_history_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      scheduled_posts: {
        Row: {
          id: string
          client_id: string
          deliverable_id: string | null
          title: string
          content: string
          platform: string
          scheduled_at: string
          status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at: string | null
          external_post_id: string | null
          notes: string | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
          campaign_tag: string | null
          content_type: string
          creative_format: string
          production_id: string | null
          skill_output_id: string | null
          publishing_status: string | null
          last_publish_attempt: string | null
          publish_retry_count: number | null
          caption_suggestion: string | null
          is_reserved: boolean
          reserved_for: string | null
          reserved_until: string | null
          is_placeholder: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          deliverable_id?: string | null
          title: string
          content?: string
          platform: string
          scheduled_at: string
          status?: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at?: string | null
          external_post_id?: string | null
          notes?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          campaign_tag?: string | null
          content_type?: string
          creative_format?: string
          production_id?: string | null
          skill_output_id?: string | null
          publishing_status?: string | null
          last_publish_attempt?: string | null
          publish_retry_count?: number | null
          caption_suggestion?: string | null
          is_reserved?: boolean
          reserved_for?: string | null
          reserved_until?: string | null
          is_placeholder?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          deliverable_id?: string | null
          title?: string
          content?: string
          platform?: string
          scheduled_at?: string
          status?: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at?: string | null
          external_post_id?: string | null
          notes?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          campaign_tag?: string | null
          content_type?: string
          creative_format?: string
          production_id?: string | null
          skill_output_id?: string | null
          publishing_status?: string | null
          last_publish_attempt?: string | null
          publish_retry_count?: number | null
          caption_suggestion?: string | null
          is_reserved?: boolean
          reserved_for?: string | null
          reserved_until?: string | null
          is_placeholder?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scheduled_posts_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scheduled_posts_deliverable_id_fkey'
            columns: ['deliverable_id']
            isOneToOne: false
            referencedRelation: 'deliverables'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scheduled_posts_production_id_fkey'
            columns: ['production_id']
            isOneToOne: false
            referencedRelation: 'content_productions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scheduled_posts_skill_output_id_fkey'
            columns: ['skill_output_id']
            isOneToOne: false
            referencedRelation: 'skill_outputs'
            referencedColumns: ['id']
          }
        ]
      }
      telegram_notification_logs: {
        Row: {
          id: string
          recipient_type: 'client' | 'admin' | 'user'
          recipient_id: string | null
          chat_id: string
          event_type: string
          status: 'sent' | 'failed' | 'skipped'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_type: 'client' | 'admin' | 'user'
          recipient_id?: string | null
          chat_id: string
          event_type: string
          status: 'sent' | 'failed' | 'skipped'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_type?: 'client' | 'admin' | 'user'
          recipient_id?: string | null
          chat_id?: string
          event_type?: string
          status?: 'sent' | 'failed' | 'skipped'
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string | null
          actor_role: string | null
          actor_name: string | null
          action: string
          entity_type: string
          entity_id: string | null
          client_id: string | null
          summary: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          actor_role?: string | null
          actor_name?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          client_id?: string | null
          summary: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          actor_role?: string | null
          actor_name?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          client_id?: string | null
          summary?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_log_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      skill_packs: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          job: string | null
          stage: string | null
          reads_files: Json
          writes_files: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          job?: string | null
          stage?: string | null
          reads_files?: Json
          writes_files?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          job?: string | null
          stage?: string | null
          reads_files?: Json
          writes_files?: Json
          created_at?: string
        }
        Relationships: []
      }
      pack_skills: {
        Row: {
          pack_id: string
          skill_id: string
        }
        Insert: {
          pack_id: string
          skill_id: string
        }
        Update: {
          pack_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pack_skills_pack_id_fkey'
            columns: ['pack_id']
            isOneToOne: false
            referencedRelation: 'skill_packs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pack_skills_skill_id_fkey'
            columns: ['skill_id']
            isOneToOne: false
            referencedRelation: 'skills'
            referencedColumns: ['id']
          }
        ]
      }
      client_skills: {
        Row: {
          id: string
          client_id: string
          skill_id: string
          status: 'belum' | 'jalan' | 'selesai'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          skill_id: string
          status?: 'belum' | 'jalan' | 'selesai'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          skill_id?: string
          status?: 'belum' | 'jalan' | 'selesai'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_skills_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'client_skills_skill_id_fkey'
            columns: ['skill_id']
            isOneToOne: false
            referencedRelation: 'skills'
            referencedColumns: ['id']
          }
        ]
      }
      ai_providers: {
        Row: {
          id: string
          label: string
          kind: 'gemini' | 'anthropic' | 'openai' | 'custom'
          model: string
          base_url: string | null
          api_key: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          kind: 'gemini' | 'anthropic' | 'openai' | 'custom'
          model: string
          base_url?: string | null
          api_key?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          kind?: 'gemini' | 'anthropic' | 'openai' | 'custom'
          model?: string
          base_url?: string | null
          api_key?: string | null
          is_default?: boolean
          created_at?: string
        }
        Relationships: []
      }
      skill_files: {
        Row: {
          skill_id: string
          path: string
          content: string
        }
        Insert: {
          skill_id: string
          path: string
          content: string
        }
        Update: {
          skill_id?: string
          path?: string
          content?: string
        }
        Relationships: [
          {
            foreignKeyName: 'skill_files_skill_id_fkey'
            columns: ['skill_id']
            isOneToOne: false
            referencedRelation: 'skills'
            referencedColumns: ['id']
          }
        ]
      }
      client_files: {
        Row: {
          client_id: string
          path: string
          content: string
          updated_at: string
        }
        Insert: {
          client_id: string
          path: string
          content: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          path?: string
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_files_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      pipeline_stages: {
        Row: {
          key: string
          label: string
          description: string | null
          sort_order: number
        }
        Insert: {
          key: string
          label: string
          description?: string | null
          sort_order: number
        }
        Update: {
          key?: string
          label?: string
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      skill_outputs: {
        Row: {
          id: string
          client_id: string
          skill_id: string
          stage: string | null
          title: string
          content: string
          status: string
          deliverable_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          skill_id: string
          stage?: string | null
          title: string
          content: string
          status?: string
          deliverable_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          skill_id?: string
          stage?: string | null
          title?: string
          content?: string
          status?: string
          deliverable_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'skill_outputs_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'skill_outputs_skill_id_fkey'
            columns: ['skill_id']
            isOneToOne: false
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'skill_outputs_deliverable_id_fkey'
            columns: ['deliverable_id']
            isOneToOne: false
            referencedRelation: 'deliverables'
            referencedColumns: ['id']
          }
        ]
      }
      deliverable_templates: {
        Row: {
          id: string
          title: string
          type: 'brief' | 'content' | 'report'
          description: string | null
          content_md: string
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          type: 'brief' | 'content' | 'report'
          description?: string | null
          content_md: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: 'brief' | 'content' | 'report'
          description?: string | null
          content_md?: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          id: string
          client_id: string
          deliverable_id: string | null
          rating: number
          title: string
          comment: string | null
          status: 'pending' | 'acknowledged' | 'resolved'
          created_at: string
          responded_at: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          deliverable_id?: string | null
          rating: number
          title: string
          comment?: string | null
          status?: 'pending' | 'acknowledged' | 'resolved'
          created_at?: string
          responded_at?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          deliverable_id?: string | null
          rating?: number
          title?: string
          comment?: string | null
          status?: 'pending' | 'acknowledged' | 'resolved'
          created_at?: string
          responded_at?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_deliverable_id_fkey'
            columns: ['deliverable_id']
            isOneToOne: false
            referencedRelation: 'deliverables'
            referencedColumns: ['id']
          }
        ]
      }
      competitor_benchmarks: {
        Row: {
          id: string
          client_id: string
          brand_name: string
          platform: string
          avg_reach: number
          avg_er: number
          weekly_posts: number
          notes: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          brand_name: string
          platform: string
          avg_reach?: number
          avg_er?: number
          weekly_posts?: number
          notes?: string | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          brand_name?: string
          platform?: string
          avg_reach?: number
          avg_er?: number
          weekly_posts?: number
          notes?: string | null
          recorded_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'competitor_benchmarks_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      seasonal_periods: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          category: string
          impact_multiplier: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          category?: string
          impact_multiplier?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          category?: string
          impact_multiplier?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      analytics_predictions: {
        Row: {
          id: string
          client_id: string
          target_month: string
          forecasted_reach: number
          forecasted_er: number
          forecasted_wa_inquiries: number
          forecasted_dm_inquiries: number
          estimated_roi_multiplier: number
          confidence_score: number
          model_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          target_month: string
          forecasted_reach?: number
          forecasted_er?: number
          forecasted_wa_inquiries?: number
          forecasted_dm_inquiries?: number
          estimated_roi_multiplier?: number
          confidence_score?: number
          model_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          target_month?: string
          forecasted_reach?: number
          forecasted_er?: number
          forecasted_wa_inquiries?: number
          forecasted_dm_inquiries?: number
          estimated_roi_multiplier?: number
          confidence_score?: number
          model_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'analytics_predictions_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      content_productions: {
        Row: {
          id: string
          client_id: string
          title: string
          platform: string
          stage: 'idea' | 'script' | 'shooting' | 'editing' | 'design' | 'caption' | 'review' | 'ready'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          assignee: string | null
          due_date: string | null
          assets: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          platform?: string
          stage?: 'idea' | 'script' | 'shooting' | 'editing' | 'design' | 'caption' | 'review' | 'ready'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assignee?: string | null
          due_date?: string | null
          assets?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          platform?: string
          stage?: 'idea' | 'script' | 'shooting' | 'editing' | 'design' | 'caption' | 'review' | 'ready'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assignee?: string | null
          due_date?: string | null
          assets?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_productions_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          client_id: string
          title: string
          role: string
          status: string
          due_date: string | null
          assignee_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          role: string
          status?: string
          due_date?: string | null
          assignee_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          role?: string
          status?: string
          due_date?: string | null
          assignee_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      kols: {
        Row: {
          id: string
          client_id: string
          name: string
          niche: string | null
          contact_info: string | null
          rate_card: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          niche?: string | null
          contact_info?: string | null
          rate_card?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          niche?: string | null
          contact_info?: string | null
          rate_card?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'kols_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      brand_assets: {
        Row: {
          id: string
          client_id: string
          category: string | null
          file_path: string
          file_type: string | null
          guidelines: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          category?: string | null
          file_path: string
          file_type?: string | null
          guidelines?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          category?: string | null
          file_path?: string
          file_type?: string | null
          guidelines?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'brand_assets_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      content_items: {
        Row: {
          id: string
          client_id: string
          campaign_id: string | null
          title: string
          stage: string
          is_urgent: boolean
          target_date: string | null
          platform: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          campaign_id?: string | null
          title: string
          stage?: string
          is_urgent?: boolean
          target_date?: string | null
          platform?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          campaign_id?: string | null
          title?: string
          stage?: string
          is_urgent?: boolean
          target_date?: string | null
          platform?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_items_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'content_items_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          }
        ]
      }
      events: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          event_date: string | null
          location: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          event_date?: string | null
          location?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          event_date?: string | null
          location?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      event_tasks: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string | null
          stage: string
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description?: string | null
          stage?: string
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          title?: string
          description?: string | null
          stage?: string
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_tasks_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          }
        ]
      }
      event_vendors: {
        Row: {
          id: string
          event_id: string
          name: string
          role: string | null
          cost: number
          contact_info: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          role?: string | null
          cost?: number
          contact_info?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          role?: string | null
          cost?: number
          contact_info?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_vendors_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          }
        ]
      }
      client_budgets: {
        Row: {
          id: string
          client_id: string
          month: string
          total_budget: number
          remaining_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          month: string
          total_budget?: number
          remaining_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          month?: string
          total_budget?: number
          remaining_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_budgets_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          client_id: string
          budget_id: string | null
          amount: number
          category: string | null
          description: string | null
          expense_date: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          budget_id?: string | null
          amount: number
          category?: string | null
          description?: string | null
          expense_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          budget_id?: string | null
          amount?: number
          category?: string | null
          description?: string | null
          expense_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_budget_id_fkey'
            columns: ['budget_id']
            isOneToOne: false
            referencedRelation: 'client_budgets'
            referencedColumns: ['id']
          }
        ]
      }
      ad_spend_logs: {
        Row: {
          id: string
          client_id: string
          campaign_name: string
          spend: number
          clicks: number
          log_date: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          campaign_name: string
          spend?: number
          clicks?: number
          log_date: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          campaign_name?: string
          spend?: number
          clicks?: number
          log_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ad_spend_logs_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      ai_usage_logs: {
        Row: {
          id: string
          client_id: string | null
          user_id: string | null
          route: string
          model: string
          provider_kind: string | null
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          cost_estimate: number
          latency_ms: number | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          user_id?: string | null
          route: string
          model: string
          provider_kind?: string | null
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          cost_estimate?: number
          latency_ms?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          user_id?: string | null
          route?: string
          model?: string
          provider_kind?: string | null
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          cost_estimate?: number
          latency_ms?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_usage_logs_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ai_usage_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      feature_flags: {
        Row: {
          key: string
          enabled: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          enabled?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          enabled?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      campaigns: {
        Row: {
          id: string
          client_id: string
          name: string
          type: 'campaign' | 'promo' | 'event'
          start_date: string | null
          end_date: string | null
          color: string
          notes: string | null
          created_at: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_campaigns_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      content_metrics: {
        Row: {
          id: string
          post_id: string
          client_id: string
          platform: string
          views: number
          reach: number
          likes: number
          comments: number
          shares: number
          saves: number
          clicks: number
          recorded_at: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_metrics_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'scheduled_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_metrics_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_pillar_enum: 'Educational' | 'Promotional' | 'BehindTheScenes' | 'IndustryInsights' | 'Entertainment'
      funnel_stage_enum: 'TOFU' | 'MOFU' | 'BOFU'
      asset_status_enum: 'Idea' | 'Draft' | 'Shooting' | 'Editing' | 'Ready' | 'Published' | 'Archived'
      platform_enum: 'Instagram' | 'LinkedIn' | 'TikTok' | 'Twitter' | 'Facebook'
      post_format_enum: 'Reel' | 'Carousel' | 'SingleImage' | 'Thread' | 'TextPost' | 'Story'
      post_status_enum: 'Draft' | 'InReview' | 'Approved' | 'Scheduled' | 'Published'
      deliverable_type: 'brief' | 'content' | 'report'
      deliverable_status: 'draft' | 'sent' | 'approved' | 'revision_requested'
      user_role: 'admin' | 'client'
      campaign_type: 'campaign' | 'promo' | 'event'
      scheduled_post_status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
      scheduled_post_priority: 'low' | 'normal' | 'high' | 'urgent'
      telegram_recipient_type: 'client' | 'admin' | 'user'
      telegram_notification_status: 'sent' | 'failed' | 'skipped'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for relations
export type Client = Database['public']['Tables']['clients']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Deliverable = Database['public']['Tables']['deliverables']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type StatusHistory = Database['public']['Tables']['status_history']['Row']
export type ContentCampaign = Database['public']['Tables']['content_campaigns']['Row']
export type PostMetric = Database['public']['Tables']['post_metrics']['Row']
export type AnalyticsSummary = Database['public']['Tables']['analytics_summaries']['Row']
export type ScheduledPost = Database['public']['Tables']['scheduled_posts']['Row']
export type CompetitorBenchmark = {
  id: string
  client_id: string
  brand_name: string
  platform: string
  avg_reach: number
  avg_er: number
  weekly_posts: number
  notes?: string | null
  recorded_at: string
  created_at: string
}
export type SeasonalPeriod = {
  id: string
  name: string
  start_date: string
  end_date: string
  category: string
  impact_multiplier: number
  notes?: string | null
  created_at: string
}
export type AnalyticsPrediction = {
  id: string
  client_id: string
  target_month: string
  forecasted_reach: number
  forecasted_er: number
  forecasted_wa_inquiries: number
  forecasted_dm_inquiries: number
  estimated_roi_multiplier: number
  confidence_score: number
  model_notes?: string | null
  created_at: string
}

// With relations
export type DeliverableWithClient = Deliverable & {
  client: Client
  created_by_user: User | null
  updated_by_user: User | null
}

export type CommentWithUser = Comment & {
  user: User
}

export type UserWithClient = User & {
  client: Client | null
}

export type ScheduledPostWithClient = ScheduledPost & {
  client: Client
  deliverable: Deliverable | null
}

// API response types
// Database type already exported via interface above
