import { useState, useEffect } from 'react';
import { contentManager } from '../services/contentManager';

interface EditableContentProps {
  id: string;
  defaultContent?: string;
  type?: 'text' | 'image' | 'link';
  className?: string;
}

export function EditableContent({ id, defaultContent = '', type = 'text', className = '' }: EditableContentProps) {
  const [content, setContent] = useState(defaultContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };

    checkAdminStatus();
    loadContent();
  }, [id]);

  const loadContent = async () => {
    const contentBlock = await contentManager.getContent(id);
    if (contentBlock) {
      setContent(contentBlock.content);
    }
  };

  const handleSave = async (newContent: string) => {
    const success = await contentManager.updateContent(id, {
      content: newContent,
      type
    });

    if (success) {
      setContent(newContent);
      setIsEditing(false);
    }
  };

  if (!isAdmin) {
    return <div className={className}>{content}</div>;
  }

  if (isEditing) {
    return (
      <div className={className}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleSave(content)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {content}
      {isAdmin && (
        <button className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-blue-500 text-white rounded-full p-1">
          ✏️
        </button>
      )}
    </div>
  );
}