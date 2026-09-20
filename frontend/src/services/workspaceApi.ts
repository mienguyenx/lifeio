import { apiFetch } from '@/integrations/api/httpClient';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  icon: string | null;
  ownerId: string;
  role: WorkspaceRole;
}

export interface WorkspacePage {
  id: string;
  workspaceId: string;
  parentPageId: string | null;
  title: string;
  icon: string | null;
  position: number;
  revision: number;
}

export interface PageBlock {
  id: string;
  pageId: string;
  parentBlockId: string | null;
  type: string;
  content: Record<string, unknown>;
  position: number;
}

export const workspaceApi = {
  async listWorkspaces() {
    return apiFetch<{ data: Workspace[] }>('/workspaces');
  },

  async createWorkspace(name: string) {
    return apiFetch<Workspace>('/workspaces', { method: 'POST', body: { name, icon: '🏠' } });
  },

  async listPages(workspaceId: string) {
    return apiFetch<{ data: WorkspacePage[] }>(`/workspaces/${workspaceId}/pages`);
  },

  async createPage(workspaceId: string, parentPageId: string | null = null) {
    return apiFetch<WorkspacePage>(`/workspaces/${workspaceId}/pages`, {
      method: 'POST',
      body: { title: 'Untitled', parentPageId },
    });
  },

  async updatePage(pageId: string, updates: Partial<Pick<WorkspacePage, 'title' | 'icon' | 'parentPageId' | 'position'>>) {
    return apiFetch<WorkspacePage>(`/pages/${pageId}`, { method: 'PATCH', body: updates });
  },

  async getBlocks(pageId: string) {
    return apiFetch<{ page: WorkspacePage; data: PageBlock[] }>(`/pages/${pageId}/blocks`);
  },

  async saveBlocks(pageId: string, baseRevision: number, blocks: PageBlock[]) {
    return apiFetch<{ revision: number; data: PageBlock[] }>(`/pages/${pageId}/blocks`, {
      method: 'PUT',
      body: {
        baseRevision,
        blocks: blocks.map(({ id, type, content, parentBlockId }) => ({ id, type, content, parentBlockId })),
      },
    });
  },
};