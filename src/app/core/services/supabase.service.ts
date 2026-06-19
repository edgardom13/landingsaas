import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabase.url,      // ← Cambiado
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,  // ← IMPORTANTE
          autoRefreshToken: true, // ← IMPORTANTE
          detectSessionInUrl: true
        }
      }
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}