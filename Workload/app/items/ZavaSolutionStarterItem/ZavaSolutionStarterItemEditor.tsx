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
import jwt_decode from "jwt-decode";
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
import { callAcquireFrontendAccessToken } from "../../controller/AuthenticationController";
import { ZavaSolutionStarterItemEditorEmpty } from "./ZavaSolutionStarterItemEditorEmpty";
import {
  ZavaSolutionStarterItemDefinition,
  OnboardingFormData,
  SolutionResource,
  DataAccessRequest,
  DataAccessRequestStatus,
} from "./ZavaSolutionStarterItemModel";
import { PackageInstallerContext } from "../PackageInstallerItem/package/PackageInstallerContext";
import { Package } from "../PackageInstallerItem/PackageInstallerItemModel";
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
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [dataAccessRequest, setDataAccessRequest] = useState({
    dataSourceName: "",
    justification: "",
  });

  // Load user info from authentication token
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        // Acquire access token with Fabric scopes to get user identity
        const fabricScopes = "https://analysis.windows.net/powerbi/api/.default";
        const tokenResult = await callAcquireFrontendAccessToken(workloadClient, fabricScopes);
        
        if (tokenResult?.token) {
          // Decode the JWT token to extract user information
          const decodedToken: any = jwt_decode(tokenResult.token);
          
          // Extract user name from token claims
          // Common claims: name, preferred_username, upn, email, unique_name
          const name = decodedToken.name || 
                       decodedToken.preferred_username || 
                       decodedToken.upn || 
                       decodedToken.unique_name ||
                       decodedToken.email || 
                       "User";
          
          setUserName(name);
          console.log("User info loaded from token:", { name, claims: decodedToken });
        }
      } catch (error) {
        console.error("Error loading user info from token:", error);
        // Fallback: try to extract user from any available context
        setUserName("User");
      }
    };

    loadUserInfo();
  }, [workloadClient]);

  useEffect(() => {
    loadDataFromUrl(pageContext, pathname);
  }, [pageContext, pathname]);

  // Load packages from assets
  useEffect(() => {
    const loadPackages = async () => {
      try {
        await packageContext.packageRegistry.loadFromAssets();
        setPackagesLoaded(true);
        console.log('Packages loaded successfully');
      } catch (error) {
        console.error('Failed to load packages:', error);
        setPackagesLoaded(true); // Set to true anyway to avoid infinite loading
      }
    };
    loadPackages();
  }, [packageContext]);

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
      } else {
        // Convert date strings back to Date objects
        if (item.definition.onboardingData?.onboardedAt && typeof item.definition.onboardingData.onboardedAt === 'string') {
          item.definition.onboardingData.onboardedAt = new Date(item.definition.onboardingData.onboardedAt);
        }
        if (item.definition.dataAccessRequests) {
          item.definition.dataAccessRequests = item.definition.dataAccessRequests.map(req => ({
            ...req,
            requestedAt: typeof req.requestedAt === 'string' ? new Date(req.requestedAt) : req.requestedAt
          }));
        }
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
      },
      {
        id: "resource-2",
        name: "Sample Datasets",
        description: "Access pre-configured sample data for testing",
        type: "dataset",
      },
      {
        id: "resource-3",
        name: "Templates & Examples",
        description: "Ready-to-use templates for common scenarios",
        type: "template",
      },
      {
        id: "resource-4",
        name: "Best Practices",
        description: "Industry best practices and guidelines",
        type: "documentation",
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
      // Create a serializable copy of the definition by converting Dates to ISO strings
      const serializableDefinition = JSON.parse(JSON.stringify(item.definition, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }));

      await saveItemDefinition(workloadClient, item.id, serializableDefinition);
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

  const handleResourceClick = (resource: SolutionResource) => {
    // Open template dialog for Templates & Examples
    if (resource.id === "resource-3") {
      setIsTemplateDialogOpen(true);
    } else {
      // Handle other resource types (can be implemented later)
      callNotificationOpen(
        workloadClient,
        t("ZavaSolutionStarterItem_Resource_Title", "Resource"),
        t("ZavaSolutionStarterItem_Resource_Message", `Opening ${resource.name}...`),
        NotificationType.Info
      );
    }
  };

  const handleTemplateAction = async (action: string) => {
    setIsTemplateDialogOpen(false);
    
    switch (action) {
      case "deploy":
        callNotificationOpen(
          workloadClient,
          t("ZavaSolutionStarterItem_Template_Deploy", "Deploy Package"),
          t("ZavaSolutionStarterItem_Template_Deploy_Message", "Starting package deployment..."),
          NotificationType.Info
        );
        // TODO: Implement package deployment logic
        break;
      case "install":
        callNotificationOpen(
          workloadClient,
          t("ZavaSolutionStarterItem_Template_Install", "Install Package"),
          t("ZavaSolutionStarterItem_Template_Install_Message", "Starting package installation..."),
          NotificationType.Info
        );
        // TODO: Implement package installation logic
        break;
      case "browse":
        callNotificationOpen(
          workloadClient,
          t("ZavaSolutionStarterItem_Template_Browse", "Browse Packages"),
          t("ZavaSolutionStarterItem_Template_Browse_Message", "Opening package browser..."),
          NotificationType.Info
        );
        // TODO: Implement package browsing logic
        break;
      case "create":
        callNotificationOpen(
          workloadClient,
          t("ZavaSolutionStarterItem_Template_Create", "Create Package"),
          t("ZavaSolutionStarterItem_Template_Create_Message", "Opening package creator..."),
          NotificationType.Info
        );
        // TODO: Implement package creation logic
        break;
      default:
        break;
    }
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

  const handleTemplateSelection = (packageId: string) => {
    const selectedPackage = packageContext.packageRegistry.getPackage(packageId);
    if (selectedPackage) {
      callNotificationOpen(
        workloadClient,
        t("ZavaSolutionStarterItem_Template_Selected", "Template Selected"),
        t("ZavaSolutionStarterItem_Template_Selected_Message", `You selected: ${selectedPackage.displayName}`),
        NotificationType.Success
      );
      setIsTemplatesDialogOpen(false);
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
                        {getResourceIcon(resource.type)}
                      </div>
                    }
                    header={<Text weight="semibold">{resource.name}</Text>}
                    description={<Text size={300}>{resource.description}</Text>}
                  />
                  <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <Button 
                      appearance="primary" 
                      size="small"
                      onClick={() => handleResourceClick(resource)}
                    >
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

          {/* Template Actions Dialog */}
          <Dialog
            open={isTemplateDialogOpen}
            onOpenChange={(event, data) => setIsTemplateDialogOpen(data.open)}
          >
            <DialogSurface>
              <DialogBody>
                <DialogTitle>
                  {t(
                    "ZavaSolutionStarterItem_Template_Dialog_Title",
                    "Templates & Examples"
                  )}
                </DialogTitle>
                <DialogContent>
                  <Stack tokens={{ childrenGap: 16 }}>
                    <Text>
                      {t(
                        "ZavaSolutionStarterItem_Template_Dialog_Description",
                        "Choose an action to work with solution packages and templates:"
                      )}
                    </Text>

                    <Stack tokens={{ childrenGap: 12 }}>
                      <Card
                        onClick={() => handleTemplateAction("deploy")}
                        style={{ cursor: "pointer" }}
                      >
                        <CardHeader
                          image={
                            <div style={{ fontSize: "24px" }}>🚀</div>
                          }
                          header={
                            <Text weight="semibold">
                              {t(
                                "ZavaSolutionStarterItem_Template_Deploy_Title",
                                "Deploy Package"
                              )}
                            </Text>
                          }
                          description={
                            <Text size={300}>
                              {t(
                                "ZavaSolutionStarterItem_Template_Deploy_Desc",
                                "Deploy a solution package to your workspace"
                              )}
                            </Text>
                          }
                        />
                      </Card>

                      <Card
                        onClick={() => handleTemplateAction("install")}
                        style={{ cursor: "pointer" }}
                      >
                        <CardHeader
                          image={
                            <div style={{ fontSize: "24px" }}>📦</div>
                          }
                          header={
                            <Text weight="semibold">
                              {t(
                                "ZavaSolutionStarterItem_Template_Install_Title",
                                "Install Package"
                              )}
                            </Text>
                          }
                          description={
                            <Text size={300}>
                              {t(
                                "ZavaSolutionStarterItem_Template_Install_Desc",
                                "Install a pre-configured solution package"
                              )}
                            </Text>
                          }
                        />
                      </Card>

                      <Card
                        onClick={() => handleTemplateAction("browse")}
                        style={{ cursor: "pointer" }}
                      >
                        <CardHeader
                          image={
                            <div style={{ fontSize: "24px" }}>🔍</div>
                          }
                          header={
                            <Text weight="semibold">
                              {t(
                                "ZavaSolutionStarterItem_Template_Browse_Title",
                                "Browse Packages"
                              )}
                            </Text>
                          }
                          description={
                            <Text size={300}>
                              {t(
                                "ZavaSolutionStarterItem_Template_Browse_Desc",
                                "Explore available solution packages and templates"
                              )}
                            </Text>
                          }
                        />
                      </Card>

                      <Card
                        onClick={() => handleTemplateAction("create")}
                        style={{ cursor: "pointer" }}
                      >
                        <CardHeader
                          image={
                            <div style={{ fontSize: "24px" }}>✨</div>
                          }
                          header={
                            <Text weight="semibold">
                              {t(
                                "ZavaSolutionStarterItem_Template_Create_Title",
                                "Create Package"
                              )}
                            </Text>
                          }
                          description={
                            <Text size={300}>
                              {t(
                                "ZavaSolutionStarterItem_Template_Create_Desc",
                                "Create a new custom solution package"
                              )}
                            </Text>
                          }
                        />
                      </Card>
                    </Stack>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button
                    appearance="secondary"
                    onClick={() => setIsTemplateDialogOpen(false)}
                  >
                    {t("ZavaSolutionStarterItem_Dialog_Close", "Close")}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </Stack>
      </div>
    </div>
  );
}
