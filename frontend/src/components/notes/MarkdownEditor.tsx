import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye, Edit3, Bold, Italic, Heading1, Heading2, List, ListOrdered, Link, Quote, Code, Minus, Image, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
}

interface ToolbarButton {
  icon: React.ElementType;
  label: string;
  action: 'wrap' | 'prefix' | 'insert';
  before?: string;
  after?: string;
  prefix?: string;
  insert?: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: Bold, label: 'In đậm (Ctrl+B)', action: 'wrap', before: '**', after: '**' },
  { icon: Italic, label: 'In nghiêng (Ctrl+I)', action: 'wrap', before: '_', after: '_' },
  { icon: Heading1, label: 'Tiêu đề 1', action: 'prefix', prefix: '# ' },
  { icon: Heading2, label: 'Tiêu đề 2', action: 'prefix', prefix: '## ' },
  { icon: List, label: 'Danh sách', action: 'prefix', prefix: '- ' },
  { icon: ListOrdered, label: 'Danh sách đánh số', action: 'prefix', prefix: '1. ' },
  { icon: Quote, label: 'Trích dẫn', action: 'prefix', prefix: '> ' },
  { icon: Code, label: 'Code', action: 'wrap', before: '`', after: '`' },
  { icon: Link, label: 'Liên kết', action: 'insert', insert: '[text](url)' },
  { icon: Image, label: 'Hình ảnh', action: 'insert', insert: '![alt text](image-url)' },
  { icon: Table, label: 'Bảng', action: 'insert', insert: '\n| Cột 1 | Cột 2 | Cột 3 |\n|-------|-------|-------|\n| A1    | B1    | C1    |\n| A2    | B2    | C2    |\n' },
  { icon: Minus, label: 'Đường kẻ ngang', action: 'insert', insert: '\n---\n' },
];

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = 'Nhập nội dung markdown...', 
  minRows = 8,
  className 
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (button: ToolbarButton) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = value;
    let newCursorPos = start;

    if (button.action === 'wrap') {
      const wrappedText = `${button.before}${selectedText || 'text'}${button.after}`;
      newText = value.substring(0, start) + wrappedText + value.substring(end);
      newCursorPos = selectedText ? end + (button.before?.length || 0) + (button.after?.length || 0) : start + (button.before?.length || 0);
    } else if (button.action === 'prefix') {
      // Find the start of the current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      newText = value.substring(0, lineStart) + button.prefix + value.substring(lineStart);
      newCursorPos = start + (button.prefix?.length || 0);
    } else if (button.action === 'insert') {
      newText = value.substring(0, start) + button.insert + value.substring(end);
      newCursorPos = start + (button.insert?.length || 0);
    }

    onChange(newText);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertText(TOOLBAR_BUTTONS[0]); // Bold
      } else if (e.key === 'i') {
        e.preventDefault();
        insertText(TOOLBAR_BUTTONS[1]); // Italic
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant={!isPreview ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(false)}
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Viết
          </Button>
          <Button
            type="button"
            variant={isPreview ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(true)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Xem trước
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">Hỗ trợ Markdown</span>
      </div>

      {!isPreview && (
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-wrap gap-1 p-1 border rounded-md bg-muted/30">
            {TOOLBAR_BUTTONS.map((button, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => insertText(button)}
                  >
                    <button.icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{button.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}

      {isPreview ? (
        <div 
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none p-3 rounded-md border bg-muted/30 min-h-[200px]",
            !value && "text-muted-foreground italic"
          )}
        >
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            'Chưa có nội dung để xem trước'
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={minRows}
          className="font-mono text-sm"
        />
      )}
    </div>
  );
}

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  if (!content) {
    return <p className="text-muted-foreground italic">Không có nội dung</p>;
  }

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
