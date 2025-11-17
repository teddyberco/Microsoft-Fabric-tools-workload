import React, { useState, useRef, useEffect } from 'react';
import { Checkbox, Text, Badge } from '@fluentui/react-components';
import { WorkspaceItem } from './WorkspaceManagerItemModel';
import '../../styles.scss';

interface Column {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  render: (item: WorkspaceItem, index: number) => React.ReactNode;
}

interface ResizableTableProps {
  items: WorkspaceItem[];
  onSelectionChange: (itemId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const ResizableTable: React.FC<ResizableTableProps> = ({ items, onSelectionChange, onSelectAll }) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    rowNumber: 60,
    name: 250,
    type: 280,
    itemId: 320,
    folder: 200,
    description: 350,
  });

  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Define columns dynamically to always use latest props
  const columns: Column[] = React.useMemo(() => {
    const cols = [
      {
        id: 'rowNumber',
        label: '',
        width: columnWidths.rowNumber,
        minWidth: 48,
        render: (item: WorkspaceItem, index: number) => (
          <div className="row-header-cell">
            <Checkbox
              checked={item.selected || false}
              onChange={(_, data) => onSelectionChange(item.id, data.checked === true)}
              className="row-checkbox"
            />
          </div>
        ),
      },
      {
        id: 'name',
        label: 'Name',
        width: columnWidths.name,
        minWidth: 150,
        render: (item: WorkspaceItem) => <Text weight="semibold" className="cell-text">{item.displayName}</Text>,
      },
      {
        id: 'type',
        label: 'Type',
        width: columnWidths.type,
        minWidth: 180,
        render: (item: WorkspaceItem) => <Badge appearance="outline" className="type-badge">{item.type}</Badge>,
      },
      {
        id: 'itemId',
        label: 'Item ID',
        width: columnWidths.itemId,
        minWidth: 220,
        render: (item: WorkspaceItem) => <Text className="cell-text item-id-text" title={item.id}>{item.id}</Text>,
      },
      {
        id: 'folder',
        label: 'Folder',
        width: columnWidths.folder,
        minWidth: 150,
        render: (item: WorkspaceItem) => <Text className="cell-text" title={item.folderPath}>{item.folderPath || '/'}</Text>,
      },
      {
        id: 'description',
        label: 'Description',
        width: columnWidths.description,
        minWidth: 200,
        render: (item: WorkspaceItem) => <Text className="cell-text description-text">{item.description || 'No description'}</Text>,
      },
    ];
    console.log('[ResizableTable] Column definitions:', cols.map(c => ({ id: c.id, label: c.label, width: c.width })));
    return cols;
  }, [columnWidths, onSelectionChange]);

  const handleMouseDown = (columnId: string, minWidth: number, currentWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnId);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn === null) return;
      
      e.preventDefault();
      const diff = e.clientX - startXRef.current;
      const column = columns.find(c => c.id === resizingColumn);
      if (!column) return;

      const newWidth = Math.max(
        column.minWidth,
        startWidthRef.current + diff
      );

      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    };

    const handleMouseUp = () => {
      if (resizingColumn !== null) {
        setResizingColumn(null);
      }
    };

    if (resizingColumn !== null) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn, columns]);

  const allSelected = items.length > 0 && items.every((item) => item.selected);
  const someSelected = items.some((item) => item.selected) && !allSelected;

  console.log('[ResizableTable] Rendering table with columns:', columns.length, 'items:', items.length);
  console.log('[ResizableTable] First item structure:', items[0]);
  console.log('[ResizableTable] Column widths:', columnWidths);

  const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
  console.log('[ResizableTable] Total table width calculated:', totalWidth);

  return (
    <div className="fabric-datagrid-container">
      <table className="fabric-datagrid" style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}>
        <thead>
          <tr>
            {columns.map((column) => {
              console.log('[ResizableTable] Rendering header for column:', column.id, column.label, `width: ${column.width}px`);
              return (
              <th key={column.id} style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px`, maxWidth: `${column.width}px` }} className={column.id === 'rowNumber' ? 'row-header-column' : ''}>
                {column.id === 'rowNumber' ? (
                  <div className="header-checkbox-container">
                    <Checkbox
                      checked={allSelected || someSelected}
                      onChange={(_, data) => onSelectAll(data.checked === true)}
                      className="header-checkbox"
                    />
                  </div>
                ) : (
                  <div className="header-content">
                    <Text className="header-text">{column.label}</Text>
                  </div>
                )}
                {column.id !== 'rowNumber' && (
                  <div
                    className={`column-resizer ${resizingColumn === column.id ? 'resizing' : ''}`}
                    onMouseDown={(e) => handleMouseDown(column.id, column.minWidth, column.width, e)}
                  />
                )}
              </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            if (index === 0) {
              console.log('[ResizableTable] Rendering first row, item:', { id: item.id, displayName: item.displayName, type: item.type, description: item.description });
            }
            return (
              <tr key={item.id} className={item.selected ? 'selected-row' : ''}>
                {columns.map((column) => {
                  if (index === 0) {
                    console.log('[ResizableTable] Rendering cell for column:', column.id, 'in first row');
                  }
                  return (
                    <td key={column.id} style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px`, maxWidth: `${column.width}px` }} className={column.id === 'rowNumber' ? 'row-header-cell-container' : ''}>
                      {column.render(item, index)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

