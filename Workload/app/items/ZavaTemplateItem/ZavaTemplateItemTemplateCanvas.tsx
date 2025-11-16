import React from "react";
import { Stack } from "@fluentui/react";
import {
  Text,
  Card,
  CardHeader,
  Button,
  Badge,
} from "@fluentui/react-components";
import { ArrowLeftRegular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { Package } from "../PackageInstallerItem/PackageInstallerItemModel";
import { PackageInstallerContext } from "../PackageInstallerItem/package/PackageInstallerContext";

interface ZavaTemplateItemTemplateCanvasProps {
  package: Package;
  context: PackageInstallerContext;
  onBack: () => void;
  onDeploy: () => void;
}

export const ZavaTemplateItemTemplateCanvas: React.FC<ZavaTemplateItemTemplateCanvasProps> = ({
  package: pkg,
  context,
  onBack,
  onDeploy
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#f0f0f0" }}>
      {/* Breadcrumb Navigation */}
      <div
        style={{
          padding: "8px 20px",
          backgroundColor: "#f0f0f0"
        }}
      >
        <Stack horizontal tokens={{ childrenGap: 0 }} verticalAlign="center" style={{ height: "46px" }}>
          <Button
            appearance="subtle"
            size="large"
            icon={<ArrowLeftRegular />}
            onClick={onBack}
          >
            {t("ZavaTemplateItem_Template_Canvas_Back", "Back")}
          </Button>
          <div style={{ 
            width: "1px", 
            height: "18px", 
            backgroundColor: "#424242",
            margin: "0 0px"
          }} />
          <Button
            appearance="subtle"
            size="large"
          >
            {pkg.displayName}
          </Button>
        </Stack>
      </div>

      {/* Toolbar */}
      <div
        style={{
          padding: "6px 8px",
          backgroundColor: "#f0f0f0"
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "6px 8px",
            boxShadow: "0px 2px 4px 0px rgba(0,0,0,0.14), 0px 0px 2px 0px rgba(0,0,0,0.12)",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            height: "45px"
          }}
        >
          <Button
            appearance="primary"
            size="medium"
            onClick={onDeploy}
          >
            {t("ZavaTemplateItem_Template_Canvas_Deploy_Action", "Deploy Package")}
          </Button>
          <Button
            appearance="subtle"
            size="medium"
            onClick={onBack}
          >
            {t("ZavaTemplateItem_Template_Canvas_Cancel", "Cancel")}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: "auto", 
        padding: "8px",
        backgroundColor: "#f0f0f0"
      }}>
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "4px",
          boxShadow: "0px 2px 4px 0px rgba(0,0,0,0.14), 0px 0px 2px 0px rgba(0,0,0,0.12)",
          padding: "24px",
          height: "100%",
          overflow: "auto"
        }}>
        <Stack tokens={{ childrenGap: 24 }}>
          {/* Package Header */}
          <Stack horizontal tokens={{ childrenGap: 16 }} verticalAlign="start">
            {pkg.icon && (
              <img
                src={pkg.icon}
                alt={pkg.displayName}
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "8px"
                }}
              />
            )}
            <Stack tokens={{ childrenGap: 8 }} style={{ flex: 1 }}>
              <Text size={900} weight="bold">
                {pkg.displayName}
              </Text>
              <Text size={400}>{pkg.description}</Text>
            </Stack>
          </Stack>

          {/* Package Contents */}
          <Stack tokens={{ childrenGap: 16 }}>
            <Text size={600} weight="semibold">
              {t("ZavaTemplateItem_Template_Canvas_Contents", "Package Contents")}
            </Text>
            <Text size={400}>
              {t(
                "ZavaTemplateItem_Template_Canvas_Contents_Description",
                "This package will create the following items in your workspace:"
              )}
            </Text>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px"
              }}
            >
              {pkg.items?.map((item, index) => (
                <Card key={index}>
                  <CardHeader
                    header={
                      <Stack tokens={{ childrenGap: 4 }}>
                        <Text weight="semibold">{item.displayName}</Text>
                        <Badge appearance="tint" size="small">
                          {item.type}
                        </Badge>
                      </Stack>
                    }
                    description={
                      <Text size={300}>
                        {item.description || t("ZavaTemplateItem_Template_Canvas_NoDescription", "No description")}
                      </Text>
                    }
                  />
                </Card>
              ))}
            </div>
          </Stack>

          {/* Deployment Options */}
          <Stack tokens={{ childrenGap: 16 }}>
            <Text size={600} weight="semibold">
              {t("ZavaTemplateItem_Template_Canvas_Options", "Deployment Options")}
            </Text>
            
            <Card>
              <Stack tokens={{ childrenGap: 12 }} style={{ padding: "16px" }}>
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Text weight="semibold">
                    {t("ZavaTemplateItem_Template_Canvas_Location", "Deployment Location:")}
                  </Text>
                  <Badge appearance="filled" color="informative">
                    {pkg.deploymentConfig.location === "Default" ? "Current Workspace" : "New Workspace"}
                  </Badge>
                </Stack>
                
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Text weight="semibold">
                    {t("ZavaTemplateItem_Template_Canvas_ItemCount", "Items to Deploy:")}
                  </Text>
                  <Text>{pkg.items?.length || 0}</Text>
                </Stack>
              </Stack>
            </Card>
          </Stack>

        </Stack>
        </div>
      </div>
    </div>
  );
};
