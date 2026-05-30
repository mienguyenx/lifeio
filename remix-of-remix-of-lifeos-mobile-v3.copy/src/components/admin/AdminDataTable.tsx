import { useState, useMemo, useCallback, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorFn?: (row: T) => any;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  visible?: boolean;
  className?: string;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  bulkActions?: { label: string; icon?: React.ElementType; variant?: 'default' | 'destructive'; action: (selectedIds: string[]) => void }[];
  pageSize?: number;
  emptyMessage?: string;
  title?: string;
  headerActions?: ReactNode;
}

type SortDirection = 'asc' | 'desc' | null;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function AdminDataTable<T>({
  data,
  columns: columnDefs,
  searchPlaceholder = 'Tìm kiếm...',
  searchFn,
  getRowId,
  onRowClick,
  bulkActions,
  pageSize: defaultPageSize = 10,
  emptyMessage = 'Không có dữ liệu',
  title,
  headerActions,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    columnDefs.forEach(c => { vis[c.id] = c.visible !== false; });
    return vis;
  });

  const visibleColumns = useMemo(
    () => columnDefs.filter(c => columnVisibility[c.id] !== false),
    [columnDefs, columnVisibility]
  );

  // Filter
  const filtered = useMemo(() => {
    if (!search || !searchFn) return data;
    return data.filter(row => searchFn(row, search));
  }, [data, search, searchFn]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortColumn || !sortDir) return filtered;
    const col = columnDefs.find(c => c.id === sortColumn);
    if (!col?.accessorFn) return filtered;
    return [...filtered].sort((a, b) => {
      const va = col.accessorFn!(a);
      const vb = col.accessorFn!(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortColumn, sortDir, columnDefs]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => sorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sorted, safePage, pageSize]
  );

  const handleSort = useCallback((colId: string) => {
    if (sortColumn === colId) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortColumn(null);
    } else {
      setSortColumn(colId);
      setSortDir('asc');
    }
  }, [sortColumn, sortDir]);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map(getRowId)));
    }
  }, [paged, selectedIds, getRowId]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const SortIcon = ({ colId }: { colId: string }) => {
    if (sortColumn !== colId) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  return (
    <Card>
      {(title || headerActions) && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {headerActions}
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 h-9"
            />
            {search && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => setSearch('')}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Bulk actions */}
            {bulkActions && selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
                {bulkActions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => { action.action(Array.from(selectedIds)); setSelectedIds(new Set()); }}
                  >
                    {action.icon && <action.icon className="w-3 h-3 mr-1" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Column toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columnDefs.map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={columnVisibility[col.id] !== false}
                    onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, [col.id]: !!checked }))}
                    className="text-xs"
                  >
                    {col.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {bulkActions && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={paged.length > 0 && selectedIds.size === paged.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                )}
                {visibleColumns.map(col => (
                  <TableHead
                    key={col.id}
                    className={cn(
                      col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      col.className
                    )}
                    onClick={col.sortable ? () => handleSort(col.id) : undefined}
                  >
                    <div className="flex items-center">
                      {col.header}
                      {col.sortable && <SortIcon colId={col.id} />}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (bulkActions ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(row => {
                  const id = getRowId(row);
                  return (
                    <TableRow
                      key={id}
                      className={cn(
                        onRowClick && 'cursor-pointer',
                        selectedIds.has(id) && 'bg-primary/5'
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {bulkActions && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(id)}
                            onCheckedChange={() => toggleOne(id)}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map(col => (
                        <TableCell key={col.id} className={col.className}>
                          {col.cell ? col.cell(row) : col.accessorFn ? String(col.accessorFn(row) ?? '') : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Hiển thị {sorted.length > 0 ? safePage * pageSize + 1 : 0}–{Math.min((safePage + 1) * pageSize, sorted.length)} / {sorted.length}</span>
            {search && <span>(lọc từ {data.length})</span>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(n => (
                  <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 0} onClick={() => setPage(0)}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs px-2 tabular-nums">
                {safePage + 1} / {totalPages}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
