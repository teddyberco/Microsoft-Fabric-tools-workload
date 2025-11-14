import React, { useEffect, useState, useCallback } from "react";
import { Stack } from "@fluentui/react";
import {
  Text,
  Card,
  CardHeader,
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Field,
  Input,
  Textarea,
  Badge,
} from "@fluentui/react-components";
import {
  DocumentRegular,
  DatabaseRegular,
  BookRegular,
  KeyRegular,
} from "@fluentui/react-icons";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ContextProps, PageProps } from "../../App";
import { ZavaSolutionStarterItemEditorRibbon } from "./ZavaSolutionStarterItemEditorRibbon";
import {
  getWorkloadItem,
  saveItemDefinition,
  ItemWithDefinition,
} from "../../controller/ItemCRUDController";
import { ItemEditorLoadingProgressBar } from "../../controls/ItemEditorLoadingProgressBar";
import { callNotificationOpen } from "../../controller/NotificationController";
import { NotificationType } from "@ms-fabric/workload-client";
import { ZavaSolutionStarterItemEditorEmpty } from "./ZavaSolutionStarterItemEditorEmpty";
import {
  ZavaSolutionStarterItemDefinition,
  OnboardingFormData,
  SolutionResource,
  DataAccessRequest,
  DataAccessRequestStatus,
} from "./ZavaSolutionStarterItemModel";
import "./../../styles.scss";

export function ZavaSolutionStarterItemEditor(props: PageProps) {
  const pageContext = useParams<ContextProps>();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { workloadClient } = props;

  const [isUnsaved, setIsUnsaved] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [editorItem, setEditorItem] = useState<
    ItemWithDefinition<ZavaSolutionStarterItemDefinition>
  >(undefined);
  const [userName, setUserName] = useState<string>("");
  const [isDataAccessDialogOpen, setIsDataAccessDialogOpen] = useState(false);
  const [dataAccessRequest, setDataAccessRequest] = useState({
    dataSourceName: "",
    justification: "",
  });

  // Load user info - for demo purposes, using a default name
  // In production, you would extract this from authentication context
  useEffect(() => {
    setUserName("User");
  }, []);

  useEffect(() => {
    loadDataFromUrl(pageContext, pathname);
  }, [pageContext, pathname]);

  async function loadDataFromUrl(pageContext: ContextProps, pathname: string) {
    setIsLoadingData(true);
    try {
      const item = await getWorkloadItem<ZavaSolutionStarterItemDefinition>(
        workloadClient,
        pageContext.itemObjectId
      );

      // Initialize definition if it doesn't exist
      if (!item.definition) {
        item.definition = {
          isOnboarded: false,
          resources: getDefaultResources(),
          dataAccessRequests: [],
        };
      }

      setEditorItem(item);
    } catch (error) {
      console.error("Error loading item:", error);
      callNotificationOpen(
        workloadClient,
        t("ZavaSolutionStarterItem_Error_Loading", "Failed to load item"),
        t("ZavaSolutionStarterItem_Error_Loading_Message", "An error occurred while loading the item."),
        NotificationType.Error
      );
    } finally {
      setIsLoadingData(false);
    }
  }

  const getDefaultResources = (): SolutionResource[] => {
    return [
      {
        id: "resource-1",
        name: "Getting Started Guide",
        description: "Learn the basics of using this solution",
        type: "documentation",
        icon: "📘",
      },
      {
        id: "resource-2",
        name: "Sample Datasets",
        description: "Access pre-configured sample data for testing",
        type: "dataset",
        icon: "📊",
      },
      {
        id: "resource-3",
        name: "Templates & Examples",
        description: "Ready-to-use templates for common scenarios",
        type: "template",
        icon: "📝",
      },
      {
        id: "resource-4",
        name: "Best Practices",
        description: "Industry best practices and guidelines",
        type: "documentation",
        icon: "⭐",
      },
    ];
  };

  const handleOnboardingComplete = useCallback(
    async (formData: OnboardingFormData) => {
      const updatedDefinition: ZavaSolutionStarterItemDefinition = {
        ...editorItem.definition,
        isOnboarded: true,
        onboardingData: formData,
      };

      const updatedItem = {
        ...editorItem,
        definition: updatedDefinition,
      };

      setEditorItem(updatedItem);
      setIsUnsaved(true);

      // Auto-save after onboarding
      await saveItem(updatedItem);
    },
    [editorItem]
  );

  const saveItem = async (
    itemToSave?: ItemWithDefinition<ZavaSolutionStarterItemDefinition>
  ) => {
    const item = itemToSave || editorItem;
    if (!item) return;

    try {
      await saveItemDefinition(workloadClient, item.id, item.definition);
      setIsUnsaved(false);
      callNotificationOpen(
        workloadClient,
        t("ZavaSolutionStarterItem_Save_Success", "Item saved successfully"),
        t("ZavaSolutionStarterItem_Save_Success_Message", "Your changes have been saved."),
        NotificationType.Success
      );
    } catch (error) {
      console.error("Error saving item:", error);
      callNotificationOpen(
        workloadClient,
        t("ZavaSolutionStarterItem_Error_Saving", "Failed to save item"),
        t("ZavaSolutionStarterItem_Error_Saving_Message", "An error occurred while saving the item."),
        NotificationType.Error
      );
    }
  };

  const handleRefresh = async () => {
    await loadDataFromUrl(pageContext, pathname);
    callNotificationOpen(
      workloadClient,
      t("ZavaSolutionStarterItem_Refresh_Success", "Content refreshed"),
      t("ZavaSolutionStarterItem_Refresh_Success_Message", "The content has been refreshed."),
      NotificationType.Success
    );
  };

  const handleDataAccessRequest = async () => {
    if (!dataAccessRequest.dataSourceName || !dataAccessRequest.justification) {
      callNotificationOpen(
        workloadClient,
        t(
          "ZavaSolutionStarterItem_DataAccess_ValidationError",
          "Please fill in all fields"
        ),
        t("ZavaSolutionStarterItem_DataAccess_ValidationError_Message", "All fields are required."),
        NotificationType.Error
      );
      return;
    }

    const newRequest: DataAccessRequest = {
      id: `req-${Date.now()}`,
      dataSourceName: dataAccessRequest.dataSourceName,
      justification: dataAccessRequest.justification,
      status: DataAccessRequestStatus.Pending,
      requestedAt: new Date(),
      requestedBy: userName,
    };

    const updatedDefinition: ZavaSolutionStarterItemDefinition = {
      ...editorItem.definition,
      dataAccessRequests: [
        ...(editorItem.definition.dataAccessRequests || []),
        newRequest,
      ],
    };

    const updatedItem = {
      ...editorItem,
      definition: updatedDefinition,
    };

    setEditorItem(updatedItem);
    setIsUnsaved(true);
    setIsDataAccessDialogOpen(false);
    setDataAccessRequest({ dataSourceName: "", justification: "" });

    await saveItem(updatedItem);

    callNotificationOpen(
      workloadClient,
      t(
        "ZavaSolutionStarterItem_DataAccess_Success",
        "Data access request submitted"
      ),
      t("ZavaSolutionStarterItem_DataAccess_Success_Message", "Your request has been submitted for review."),
      NotificationType.Success
    );
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "documentation":
        return <BookRegular />;
      case "dataset":
        return <DatabaseRegular />;
      case "template":
        return <DocumentRegular />;
      default:
        return <DocumentRegular />;
    }
  };

  if (isLoadingData) {
    return <ItemEditorLoadingProgressBar message={t("ZavaSolutionStarterItem_Loading", "Loading...")} />;
  }

  if (!editorItem) {
    return (
      <Text>
        {t("ZavaSolutionStarterItem_Error_NotFound", "Item not found")}
      </Text>
    );
  }

  // Show onboarding form if not onboarded
  if (!editorItem.definition.isOnboarded) {
    return (
      <div className="item-page">
        <ZavaSolutionStarterItemEditorRibbon
          {...props}
          isRibbonDisabled={true}
          isSaveButtonEnabled={false}
          saveItemCallback={() => Promise.resolve()}
          onSettingsCallback={() => {}}
        />
        <div className="item-content">
          <ZavaSolutionStarterItemEditorEmpty
            userName={userName}
            onOnboardingComplete={handleOnboardingComplete}
          />
        </div>
      </div>
    );
  }

  // Main solution starter experience
  return (
    <div className="item-page">
      <ZavaSolutionStarterItemEditorRibbon
        {...props}
        isSaveButtonEnabled={isUnsaved}
        saveItemCallback={() => saveItem()}
        onRefreshCallback={handleRefresh}
      />
      <div className="item-content" style={{ padding: "20px" }}>
        <Stack tokens={{ childrenGap: 24 }}>
          {/* Welcome Section */}
          <Stack tokens={{ childrenGap: 8 }}>
            <Text as="h2" size={700} weight="semibold">
              {t(
                "ZavaSolutionStarterItem_Welcome_Title",
                `Welcome, ${editorItem.definition.onboardingData?.userName || "User"}!`
              )}
            </Text>
            <Text>
              {t(
                "ZavaSolutionStarterItem_Welcome_Subtitle",
                "Access your solution resources and request data access below"
              )}
            </Text>
          </Stack>

          {/* Solution Resources */}
          <Stack tokens={{ childrenGap: 12 }}>
            <Text as="h3" size={600} weight="semibold">
              {t("ZavaSolutionStarterItem_Resources_Title", "Solution Resources")}
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {editorItem.definition.resources?.map((resource) => (
                <Card key={resource.id}>
                  <CardHeader
                    image={
                      <div style={{ fontSize: "32px" }}>
                        {resource.icon || getResourceIcon(resource.type)}
                      </div>
                    }
                    header={<Text weight="semibold">{resource.name}</Text>}
                    description={<Text size={300}>{resource.description}</Text>}
                  />
                  <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <Button appearance="primary" size="small">
                      {t("ZavaSolutionStarterItem_Resource_Open", "Open")}
                    </Button>
                  </Stack>
                </Card>
              ))}

              {/* Ask for Data Access Card */}
              <Card>
                <CardHeader
                  image={
                    <div style={{ fontSize: "32px" }}>
                      <KeyRegular />
                    </div>
                  }
                  header={
                    <Text weight="semibold">
                      {t(
                        "ZavaSolutionStarterItem_DataAccess_Title",
                        "Ask for Data Access"
                      )}
                    </Text>
                  }
                  description={
                    <Text size={300}>
                      {t(
                        "ZavaSolutionStarterItem_DataAccess_Description",
                        "Request access to data you don't have permissions for"
                      )}
                    </Text>
                  }
                />
                <Stack horizontal tokens={{ childrenGap: 8 }}>
                  <Dialog
                    open={isDataAccessDialogOpen}
                    onOpenChange={(e, data) =>
                      setIsDataAccessDialogOpen(data.open)
                    }
                  >
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="primary" size="small">
                        {t(
                          "ZavaSolutionStarterItem_DataAccess_Request",
                          "Request Access"
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogSurface>
                      <DialogBody>
                        <DialogTitle>
                          {t(
                            "ZavaSolutionStarterItem_DataAccess_Dialog_Title",
                            "Request Data Access"
                          )}
                        </DialogTitle>
                        <DialogContent>
                          <Stack tokens={{ childrenGap: 16 }}>
                            <Field
                              label={t(
                                "ZavaSolutionStarterItem_DataAccess_DataSource_Label",
                                "Data Source Name"
                              )}
                              required
                            >
                              <Input
                                value={dataAccessRequest.dataSourceName}
                                onChange={(e, data) =>
                                  setDataAccessRequest({
                                    ...dataAccessRequest,
                                    dataSourceName: data.value,
                                  })
                                }
                                placeholder={t(
                                  "ZavaSolutionStarterItem_DataAccess_DataSource_Placeholder",
                                  "e.g., Sales Database, Customer Analytics"
                                )}
                              />
                            </Field>
                            <Field
                              label={t(
                                "ZavaSolutionStarterItem_DataAccess_Justification_Label",
                                "Business Justification"
                              )}
                              required
                            >
                              <Textarea
                                value={dataAccessRequest.justification}
                                onChange={(e, data) =>
                                  setDataAccessRequest({
                                    ...dataAccessRequest,
                                    justification: data.value,
                                  })
                                }
                                placeholder={t(
                                  "ZavaSolutionStarterItem_DataAccess_Justification_Placeholder",
                                  "Explain why you need access to this data..."
                                )}
                                rows={4}
                              />
                            </Field>
                          </Stack>
                        </DialogContent>
                        <DialogActions>
                          <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary">
                              {t("ZavaSolutionStarterItem_Dialog_Cancel", "Cancel")}
                            </Button>
                          </DialogTrigger>
                          <Button
                            appearance="primary"
                            onClick={handleDataAccessRequest}
                          >
                            {t(
                              "ZavaSolutionStarterItem_Dialog_Submit",
                              "Submit Request"
                            )}
                          </Button>
                        </DialogActions>
                      </DialogBody>
                    </DialogSurface>
                  </Dialog>
                </Stack>
              </Card>
            </div>
          </Stack>

          {/* Data Access Requests */}
          {editorItem.definition.dataAccessRequests &&
            editorItem.definition.dataAccessRequests.length > 0 && (
              <Stack tokens={{ childrenGap: 12 }}>
                <Text as="h3" size={600} weight="semibold">
                  {t(
                    "ZavaSolutionStarterItem_Requests_Title",
                    "Your Data Access Requests"
                  )}
                </Text>
                <Stack tokens={{ childrenGap: 8 }}>
                  {editorItem.definition.dataAccessRequests.map((request) => (
                    <Card key={request.id}>
                      <Stack horizontal horizontalAlign="space-between">
                        <Stack tokens={{ childrenGap: 4 }}>
                          <Text weight="semibold">{request.dataSourceName}</Text>
                          <Text size={300}>{request.justification}</Text>
                          <Text size={200}>
                            {t(
                              "ZavaSolutionStarterItem_Request_Date",
                              "Requested on"
                            )}{" "}
                            {request.requestedAt.toLocaleDateString()}
                          </Text>
                        </Stack>
                        <Badge
                          appearance={
                            request.status === DataAccessRequestStatus.Approved
                              ? "filled"
                              : request.status === DataAccessRequestStatus.Denied
                              ? "ghost"
                              : "outline"
                          }
                          color={
                            request.status === DataAccessRequestStatus.Approved
                              ? "success"
                              : request.status === DataAccessRequestStatus.Denied
                              ? "danger"
                              : "informative"
                          }
                        >
                          {request.status}
                        </Badge>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            )}
        </Stack>
      </div>
    </div>
  );
}
