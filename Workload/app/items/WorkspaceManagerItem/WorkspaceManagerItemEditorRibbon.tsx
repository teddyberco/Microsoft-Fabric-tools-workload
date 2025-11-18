import React, { useState } from "react";
import { Tab, TabList } from '@fluentui/react-tabs';
import { Toolbar } from '@fluentui/react-toolbar';
import {
  ToolbarButton, Tooltip, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Button, Dropdown, Option, Field
} from '@fluentui/react-components';
import {
  Save24Regular,
  Settings24Regular,
  Copy24Regular,
  Delete24Regular,
  ArrowSync24Regular,
  Link24Regular,
  DocumentCopy24Regular
} from "@fluentui/react-icons";
import { PageProps } from '../../App';
import '../../styles.scss';

const WorkspaceManagerItemEditorRibbonHomeTabToolbar = (props: WorkspaceManagerItemEditorRibbonProps) => {

  async function onSaveClicked() {
    await props.saveItemCallback();
    return;
  }

  async function onSettingsClicked() {
    await props.openSettingsCallback();
    return;
  }

  async function onRefreshClicked() {
    if (props.refreshWorkspaceCallback) {
      await props.refreshWorkspaceCallback();
    }
    return;
  }

  async function onBulkDeleteClicked() {
    if (props.bulkDeleteCallback) {
      await props.bulkDeleteCallback();
    }
    return;
  }

  async function onBulkCopyClicked() {
    if (props.bulkCopyCallback) {
      await props.bulkCopyCallback();
    }
    return;
  }

  async function onRebindReportClicked() {
    if (props.rebindReportCallback) {
      await props.rebindReportCallback();
    }
    return;
  }

  async function onCloneSemanticModelClicked() {
    if (props.cloneSemanticModelCallback) {
      await props.cloneSemanticModelCallback();
    }
    return;
  }

  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [tempSelectedFolderId, setTempSelectedFolderId] = useState<string>('');

  async function onDeleteFolderClicked() {
    setTempSelectedFolderId('');
    setShowFolderDialog(true);
  }

  async function handleConfirmDeleteFolder() {
    if (!tempSelectedFolderId) return;
    
    setShowFolderDialog(false);
    
    // Pass the folder ID directly to the delete callback
    if (props.deleteFolderCallback) {
      await props.deleteFolderCallback(tempSelectedFolderId);
    }
  }

  return (
    <Toolbar>
      <Tooltip
        content="Save"
        relationship="label">
        <ToolbarButton
          disabled={!props.isSaveButtonEnabled}
          aria-label="Save"
          data-testid="workspace-manager-item-editor-save-btn"
          icon={<Save24Regular />}
          onClick={onSaveClicked} />
      </Tooltip>
      <Tooltip
        content="Refresh Items"
        relationship="label">
        <ToolbarButton
          aria-label="Refresh Items"
          data-testid="workspace-manager-item-editor-refresh-btn"
          icon={<ArrowSync24Regular />}
          onClick={onRefreshClicked} />
      </Tooltip>
      <Tooltip
        content="Bulk Copy"
        relationship="label">
        <ToolbarButton
          aria-label="Bulk Copy"
          data-testid="workspace-manager-item-editor-bulk-copy-btn"
          icon={<Copy24Regular />}
          onClick={onBulkCopyClicked}
          disabled={!props.hasSelectedItems} />
      </Tooltip>
      <Tooltip
        content="Bulk Delete"
        relationship="label">
        <ToolbarButton
          aria-label="Bulk Delete"
          data-testid="workspace-manager-item-editor-bulk-delete-btn"
          icon={<Delete24Regular />}
          onClick={onBulkDeleteClicked}
          disabled={!props.hasSelectedItems} />
      </Tooltip>
      <Tooltip
        content="Rebind Report to Different Semantic Model"
        relationship="label">
        <ToolbarButton
          aria-label="Rebind Report"
          data-testid="workspace-manager-item-editor-rebind-report-btn"
          icon={<Link24Regular />}
          onClick={onRebindReportClicked}
          disabled={!props.hasSelectedReport} />
      </Tooltip>
      <Tooltip
        content="Clone Semantic Model"
        relationship="label">
        <ToolbarButton
          aria-label="Clone Semantic Model"
          data-testid="workspace-manager-item-editor-clone-semantic-model-btn"
          icon={<DocumentCopy24Regular />}
          onClick={onCloneSemanticModelClicked}
          disabled={!props.hasSelectedSemanticModel} />
      </Tooltip>
      <Button
        appearance="primary"
        data-testid="workspace-manager-item-editor-delete-folder-btn"
        onClick={onDeleteFolderClicked}
        disabled={!props.hasFoldersAvailable}>
        Delete Folder
      </Button>
      <Tooltip
        content="Settings"
        relationship="label">
        <ToolbarButton
          aria-label="Settings"
          data-testid="workspace-manager-item-editor-settings-btn"
          icon={<Settings24Regular />}
          onClick={onSettingsClicked} />
      </Tooltip>

      <Dialog open={showFolderDialog} onOpenChange={(_, data) => setShowFolderDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogContent>
              <Field label="Select folder to delete" required>
                <Dropdown
                  placeholder="Select folder"
                  value={props.folders?.find(f => f.id === tempSelectedFolderId)?.displayName || ''}
                  onOptionSelect={(_, data) => setTempSelectedFolderId(data.optionValue as string)}
                >
                  {props.folders?.map(folder => (
                    <Option key={folder.id} value={folder.id}>
                      {folder.displayName}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setShowFolderDialog(false)}>Cancel</Button>
              <Button appearance="primary" onClick={handleConfirmDeleteFolder} disabled={!tempSelectedFolderId}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </Toolbar>
  );
};

export interface WorkspaceManagerItemEditorRibbonProps extends PageProps {
  isRibbonDisabled?: boolean;
  isSaveButtonEnabled?: boolean;
  hasSelectedItems?: boolean;
  hasSelectedReport?: boolean;
  hasSelectedSemanticModel?: boolean;
  hasFoldersAvailable?: boolean;
  folders?: Array<{id: string, displayName: string}>;
  saveItemCallback: () => Promise<void>;
  openSettingsCallback: () => Promise<void>;
  refreshWorkspaceCallback?: () => Promise<void>;
  bulkCopyCallback?: () => Promise<void>;
  bulkDeleteCallback?: () => Promise<void>;
  rebindReportCallback?: () => Promise<void>;
  cloneSemanticModelCallback?: () => Promise<void>;
  deleteFolderCallback?: (folderId?: string) => Promise<void>;
}

export function WorkspaceManagerItemEditorRibbon(props: WorkspaceManagerItemEditorRibbonProps) {
  const { isRibbonDisabled } = props;
  return (
    <div className="ribbon">
      <TabList disabled={isRibbonDisabled}>
        <Tab value="home" data-testid="home-tab-btn">
          Home
        </Tab>
      </TabList>
      <div className="toolbarContainer">
        <WorkspaceManagerItemEditorRibbonHomeTabToolbar {...props} />
      </div>
    </div>
  );
};
