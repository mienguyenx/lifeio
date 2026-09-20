import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilePlus2, Heading2, ListTodo, Loader2, PanelsTopLeft, Plus, Save, Type } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { HttpError } from '@/integrations/api/httpClient';
import { PageBlock, Workspace, WorkspacePage as Page, workspaceApi } from '@/services/workspaceApi';

function makeBlock(type: 'paragraph' | 'heading_2' | 'todo'): PageBlock {
  return {
    id: crypto.randomUUID(),
    pageId: '',
    parentBlockId: null,
    type,
    content: type === 'todo' ? { text: '', checked: false } : { text: '' },
    position: 0,
  };
}

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [pageId, setPageId] = useState<string | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === workspaceId) ?? null,
    [workspaceId, workspaces],
  );

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const result = await workspaceApi.listWorkspaces();
      setWorkspaces(result.data);
      setWorkspaceId((current) => current ?? result.data[0]?.id ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (!workspaceId) {
      setPages([]);
      return;
    }
    void workspaceApi.listPages(workspaceId).then(({ data }) => {
      setPages(data);
      setPageId((current) => (current && data.some((item) => item.id === current) ? current : data[0]?.id ?? null));
    });
  }, [workspaceId]);

  useEffect(() => {
    if (!pageId) {
      setPage(null);
      setBlocks([]);
      return;
    }
    void workspaceApi
      .getBlocks(pageId)
      .then(({ page: loadedPage, data }) => {
        setPage(loadedPage);
        setBlocks(data.length > 0 ? data : [makeBlock('paragraph')]);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Không tải được trang'));
  }, [pageId]);

  const createWorkspace = async () => {
    const workspace = await workspaceApi.createWorkspace('My LifeOS');
    setWorkspaces((items) => [...items, { ...workspace, role: 'owner' }]);
    setWorkspaceId(workspace.id);
    toast.success('Đã tạo workspace');
  };

  const createPage = async () => {
    if (!workspaceId) return;
    const created = await workspaceApi.createPage(workspaceId, null);
    setPages((items) => [...items, created]);
    setPageId(created.id);
  };

  const updateBlock = (id: string, patch: Record<string, unknown>) => {
    setBlocks((items) => items.map((block) => (block.id === id ? { ...block, content: { ...block.content, ...patch } } : block)));
  };

  const addBlock = (type: 'paragraph' | 'heading_2' | 'todo') => {
    setBlocks((items) => [...items, makeBlock(type)]);
  };

  const save = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const result = await workspaceApi.saveBlocks(page.id, page.revision, blocks);
      setPage({ ...page, revision: result.revision });
      setBlocks(result.data);
      toast.success('Đã lưu');
    } catch (error) {
      if (error instanceof HttpError && error.status === 409) {
        toast.error('Trang đã thay đổi ở nơi khác. Hãy tải lại trước khi lưu.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Lưu thất bại');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (workspaces.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <PanelsTopLeft className="h-12 w-12 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Tạo workspace đầu tiên</h1>
          <p className="mt-2 text-muted-foreground">Workspace chứa cây trang và các block nội dung của bạn.</p>
        </div>
        <Button onClick={() => void createWorkspace()}><Plus className="mr-2 h-4 w-4" />Tạo workspace</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[calc(100dvh-3rem)]">
      <aside className="w-64 shrink-0 border-r bg-muted/20 p-3">
        <select
          value={workspaceId ?? ''}
          onChange={(event) => setWorkspaceId(event.target.value)}
          className="mb-3 h-9 w-full rounded-md border bg-background px-2 text-sm font-medium"
        >
          {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.icon} {workspace.name}</option>)}
        </select>
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pages</span>
          {selectedWorkspace?.role !== 'viewer' && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void createPage()}>
              <FilePlus2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-1">
          {pages.map((item) => (
            <button
              key={item.id}
              onClick={() => setPageId(item.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                pageId === item.id && 'bg-muted font-medium',
              )}
            >
              <span>{item.icon ?? '📄'}</span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        {page ? (
          <div className="mx-auto max-w-3xl px-8 py-12">
            <Input
              value={page.title}
              onChange={(event) => setPage({ ...page, title: event.target.value })}
              onBlur={() => {
                const title = page.title.trim() || 'Untitled';
                void workspaceApi.updatePage(page.id, { title }).then((updated) => {
                  setPage(updated);
                  setPages((items) => items.map((item) => (item.id === updated.id ? updated : item)));
                });
              }}
              className="mb-8 h-auto border-0 px-0 text-4xl font-bold shadow-none focus-visible:ring-0"
            />

            <div className="space-y-2">
              {blocks.map((block) => {
                const text = String(block.content.text ?? '');
                if (block.type === 'todo') {
                  return (
                    <div key={block.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(block.content.checked)}
                        onChange={(event) => updateBlock(block.id, { checked: event.target.checked })}
                        className="mt-2 h-4 w-4"
                      />
                      <Textarea
                        value={text}
                        onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                        placeholder="To-do"
                        rows={1}
                        className="min-h-9 resize-none border-0 px-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  );
                }
                return (
                  <Textarea
                    key={block.id}
                    value={text}
                    onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                    placeholder={block.type === 'heading_2' ? 'Heading' : "Type '/' for commands"}
                    rows={1}
                    className={cn(
                      'min-h-9 resize-none border-0 px-0 shadow-none focus-visible:ring-0',
                      block.type === 'heading_2' && 'text-2xl font-semibold',
                    )}
                  />
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => addBlock('paragraph')}><Type className="mr-2 h-4 w-4" />Text</Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('heading_2')}><Heading2 className="mr-2 h-4 w-4" />Heading</Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('todo')}><ListTodo className="mr-2 h-4 w-4" />To-do</Button>
              <Button size="sm" className="ml-auto" disabled={saving || selectedWorkspace?.role === 'viewer'} onClick={() => void save()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Lưu
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">Chọn hoặc tạo một trang.</div>
        )}
      </main>
    </div>
  );
}