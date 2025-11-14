import React from "react";
import { Tab, TabList } from "@fluentui/react-tabs";
import { Toolbar } from "@fluentui/react-toolbar";
import { ToolbarButton, Tooltip } from "@fluentui/react-components";
import {
  Save24Regular,
  Settings24Regular,
  ArrowSync24Regular,
} from "@fluentui/react-icons";
import { PageProps } from "../../App";
import "../../styles.scss";
import { t } from "i18next";

const ZavaSolutionStarterItemEditorRibbonHomeTabToolbar = (
  props: ZavaSolutionStarterItemEditorRibbonProps
) => {
  async function onSaveClicked() {
    await props.saveItemCallback();
    return;
  }

  async function onRefreshClicked() {
    if (props.onRefreshCallback) {
      await props.onRefreshCallback();
    }
    return;
  }

  return (
    <Toolbar>
      <Tooltip
        content={t("ZavaSolutionStarterItem_Ribbon_Save_Label", "Save")}
        relationship="label"
      >
        <ToolbarButton
          disabled={!props.isSaveButtonEnabled}
          aria-label={t("ZavaSolutionStarterItem_Ribbon_Save_Label", "Save")}
          data-testid="zava-solution-starter-item-editor-save-btn"
          icon={<Save24Regular />}
          onClick={onSaveClicked}
        />
      </Tooltip>
      <Tooltip
        content={t("ZavaSolutionStarterItem_Ribbon_Refresh_Label", "Refresh")}
        relationship="label"
      >
        <ToolbarButton
          aria-label={t("ZavaSolutionStarterItem_Ribbon_Refresh_Label", "Refresh")}
          data-testid="zava-solution-starter-item-editor-refresh-btn"
          icon={<ArrowSync24Regular />}
          onClick={onRefreshClicked}
        />
      </Tooltip>
      <Tooltip
        content={t("ZavaSolutionStarterItem_Ribbon_Settings_Label", "Settings")}
        relationship="label"
      >
        <ToolbarButton
          aria-label={t("ZavaSolutionStarterItem_Ribbon_Settings_Label", "Settings")}
          data-testid="zava-solution-starter-item-editor-settings-btn"
          icon={<Settings24Regular />}
          onClick={props.onSettingsCallback}
        />
      </Tooltip>
    </Toolbar>
  );
};

export interface ZavaSolutionStarterItemEditorRibbonProps extends PageProps {
  isRibbonDisabled?: boolean;
  isSaveButtonEnabled?: boolean;
  saveItemCallback: () => Promise<void>;
  onRefreshCallback?: () => Promise<void>;
  onSettingsCallback?: () => void;
  onTabChange?: (tabValue: string) => void;
  selectedTab?: string;
}

export function ZavaSolutionStarterItemEditorRibbon(
  props: ZavaSolutionStarterItemEditorRibbonProps
) {
  const { isRibbonDisabled } = props;

  return (
    <div className="ribbon">
      <TabList disabled={isRibbonDisabled}>
        <Tab value="home" data-testid="home-tab-btn">
          {t("ZavaSolutionStarterItem_Ribbon_Home_Label", "Home")}
        </Tab>
      </TabList>
      <div className="toolbarContainer">
        <ZavaSolutionStarterItemEditorRibbonHomeTabToolbar {...props} />
      </div>
    </div>
  );
}
