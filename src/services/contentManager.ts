import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ContentBlock {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'link';
  metadata?: Record<string, any>;
  updated_at: string;
}

export class ContentManager {
  private static instance: ContentManager;

  private constructor() {}

  static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }

  async getContent(id: string): Promise<ContentBlock | null> {
    const { data, error } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching content:', error);
      return null;
    }

    return data;
  }

  async updateContent(id: string, content: Partial<ContentBlock>): Promise<boolean> {
    const { error } = await supabase
      .from('content_blocks')
      .update({
        ...content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating content:', error);
      return false;
    }

    return true;
  }

  async getAllContent(): Promise<ContentBlock[]> {
    const { data, error } = await supabase
      .from('content_blocks')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching all content:', error);
      return [];
    }

    return data || [];
  }
}

export const contentManager = ContentManager.getInstance();