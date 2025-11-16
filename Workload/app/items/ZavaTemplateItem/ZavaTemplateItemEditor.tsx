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
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
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
import { ZavaTemplateItemEditorRibbon } from "./ZavaTemplateItemEditorRibbon";
import {
  getWorkloadItem,
  saveItemDefinition,
  ItemWithDefinition,
} from "../../controller/ItemCRUDController";
import { ItemEditorLoadingProgressBar } from "../../controls/ItemEditorLoadingProgressBar";
import { callNotificationOpen } from "../../controller/NotificationController";
import { NotificationType } from "@ms-fabric/workload-client";
import { callAcquireFrontendAccessToken } from "../../controller/AuthenticationController";
import { ZavaTemplateItemEditorEmpty } from "./ZavaTemplateItemEditorEmpty";
import {
  ZavaTemplateItemDefinition,
  OnboardingFormData,
  SolutionResource,
  DataAccessRequest,
  DataAccessRequestStatus,
} from "./ZavaTemplateItemModel";
import { PackageInstallerContext } from "../PackageInstallerItem/package/PackageInstallerContext";
import { Package, PackageDeployment, DeploymentStatus } from "../PackageInstallerItem/PackageInstallerItemModel";
import { ZavaTemplateItemTemplateCanvas } from "./ZavaTemplateItemTemplateCanvas";
import { callDialogOpen } from "../../controller/DialogController";
import { PackageInstallerDeployResult } from "../PackageInstallerItem/components/PackageInstallerDeployDialog";
import { DeploymentStrategyFactory } from "../PackageInstallerItem/deployment/DeploymentStrategyFactory";
import { WorkspaceDisplayNameCell } from "../PackageInstallerItem/components/WorkspaceDisplayName";
import "./../../styles.scss";

export function ZavaTemplateItemEditor(props: PageProps) {
  const pageContext = useParams<ContextProps>();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { workloadClient } = props;

  const [isUnsaved, setIsUnsaved] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [editorItem, setEditorItem] = useState<
    ItemWithDefinition<ZavaTemplateItemDefinition>
  >(undefined);
  const [userName, setUserName] = useState<string>("");
  const [isDataAccessDialogOpen, setIsDataAccessDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [showTemplateCanvas, setShowTemplateCanvas] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | undefined>(undefined);
  const [packageContext] = useState<PackageInstallerContext>(new PackageInstallerContext(workloadClient));
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
        console.log('Packages loaded successfully');
      } catch (error) {
        console.error('Failed to load packages:', error);
      }
    };
    loadPackages();
  }, [packageContext]);

  async function loadDataFromUrl(pageContext: ContextProps, pathname: string) {
    setIsLoadingData(true);
    try {
      const item = await getWorkloadItem<ZavaTemplateItemDefinition>(
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
          item.definition.dataAccessRequests = item.definition.dataAccessRequests.map((req: DataAccessRequest) => ({
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
        t("ZavaTemplateItem_Error_Loading", "Failed to load item"),
        t("ZavaTemplateItem_Error_Loading_Message", "An error occurred while loading the item."),
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
      const updatedDefinition: ZavaTemplateItemDefinition = {
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
    itemToSave?: ItemWithDefinition<ZavaTemplateItemDefinition>
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
        t("ZavaTemplateItem_Save_Success", "Item saved successfully"),
        t("ZavaTemplateItem_Save_Success_Message", "Your changes have been saved."),
        NotificationType.Success
      );
    } catch (error) {
      console.error("Error saving item:", error);
      callNotificationOpen(
        workloadClient,
        t("ZavaTemplateItem_Error_Saving", "Failed to save item"),
        t("ZavaTemplateItem_Error_Saving_Message", "An error occurred while saving the item."),
        NotificationType.Error
      );
    }
  };

  const handleRefresh = async () => {
    await loadDataFromUrl(pageContext, pathname);
    callNotificationOpen(
      workloadClient,
      t("ZavaTemplateItem_Refresh_Success", "Content refreshed"),
      t("ZavaTemplateItem_Refresh_Success_Message", "The content has been refreshed."),
      NotificationType.Success
    );
  };

  const handleDataAccessRequest = async () => {
    if (!dataAccessRequest.dataSourceName || !dataAccessRequest.justification) {
      callNotificationOpen(
        workloadClient,
        t(
          "ZavaTemplateItem_DataAccess_ValidationError",
          "Please fill in all fields"
        ),
        t("ZavaTemplateItem_DataAccess_ValidationError_Message", "All fields are required."),
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

    const updatedDefinition: ZavaTemplateItemDefinition = {
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
        "ZavaTemplateItem_DataAccess_Success",
        "Data access request submitted"
      ),
      t("ZavaTemplateItem_DataAccess_Success_Message", "Your request has been submitted for review."),
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
        t("ZavaTemplateItem_Resource_Title", "Resource"),
        t("ZavaTemplateItem_Resource_Message", `Opening ${resource.name}...`),
        NotificationType.Info
      );
    }
  };

  const handlePackageSelected = (packageId: string) => {
    const pkg = packageContext.getPackage(packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      setIsTemplateDialogOpen(false);
      setShowTemplateCanvas(true);
    }
  };

  const handleBackToHome = () => {
    setShowTemplateCanvas(false);
    setSelectedPackage(undefined);
  };

  const handleDeployPackage = async () => {
    if (!selectedPackage || !editorItem) return;

    try {
      // Create a deployment record
      const deploymentId = Math.random().toString(36).substring(2, 9);
      const deployment: PackageDeployment = {
        id: deploymentId,
        status: DeploymentStatus.Pending,
        deployedItems: [],
        packageId: selectedPackage.id,
      };

      // Get deployment location
      const deploymentLocation = selectedPackage.deploymentConfig.location;
      const packageDataParam = encodeURIComponent(JSON.stringify(selectedPackage));

      // Open deployment dialog to select workspace/capacity
      const dialogResult = await callDialogOpen(
        workloadClient,
        process.env.WORKLOAD_NAME,
        `/PackageInstallerItem-deploy-dialog/${editorItem.id}?packageId=${selectedPackage.id}&deploymentId=${deploymentId}&deploymentLocation=${deploymentLocation}&packageData=${packageDataParam}`,
        800,
        600,
        true
      );

      const result = dialogResult.value as PackageInstallerDeployResult;

      if (result && result.state === 'deploy') {
        // Update deployment with workspace config
        if (result.workspaceConfig) {
          deployment.workspace = {
            ...result.workspaceConfig
          };
        }

        // Update status and trigger time
        deployment.status = DeploymentStatus.InProgress;
        deployment.triggeredTime = new Date();
        deployment.triggeredBy = "User"; // TODO: Get actual user

        callNotificationOpen(
          workloadClient,
          t("ZavaTemplateItem_Template_Deploy", "Deploying Package"),
          t("ZavaTemplateItem_Template_Deploy_Message", `Starting deployment of ${selectedPackage.displayName}...`),
          NotificationType.Info
        );

        // Create a temporary item wrapper with PackageInstallerItemDefinition structure
        const tempItem = {
          ...editorItem,
          definition: {
            deployments: []
          }
        } as any;

        // Create deployment strategy and execute
        const strategy = DeploymentStrategyFactory.createStrategy(
          packageContext,
          tempItem,
          selectedPackage,
          deployment
        );

        const updatedDeployment = await strategy.deploy((step: string, progress: number) => {
          console.log(`Deployment progress: ${step} - ${progress}%`);
        });

        // Save the deployment to the item definition
        const currentDeployments = editorItem.definition.deployments || [];
        const updatedDefinition: ZavaTemplateItemDefinition = {
          ...editorItem.definition,
          deployments: [...currentDeployments, updatedDeployment]
        };
        
        setEditorItem({
          ...editorItem,
          definition: updatedDefinition
        });
        
        await saveItemDefinition<ZavaTemplateItemDefinition>(
          workloadClient,
          editorItem.id,
          updatedDefinition
        );
        setIsUnsaved(false);

        // Show result
        if (updatedDeployment.status === DeploymentStatus.Succeeded) {
          callNotificationOpen(
            workloadClient,
            t("ZavaTemplateItem_Template_Deploy_Success", "Deployment Successful"),
            t("ZavaTemplateItem_Template_Deploy_Success_Message", `${selectedPackage.displayName} has been deployed successfully.`),
            NotificationType.Success
          );
          // Return to home after successful deployment
          handleBackToHome();
        } else if (updatedDeployment.status === DeploymentStatus.Failed) {
          callNotificationOpen(
            workloadClient,
            t("ZavaTemplateItem_Template_Deploy_Failed", "Deployment Failed"),
            t("ZavaTemplateItem_Template_Deploy_Failed_Message", `Failed to deploy ${selectedPackage.displayName}.`),
            NotificationType.Error
          );
        } else if (updatedDeployment.status === DeploymentStatus.InProgress) {
          callNotificationOpen(
            workloadClient,
            t("ZavaTemplateItem_Template_Deploy_InProgress", "Deployment Started"),
            t("ZavaTemplateItem_Template_Deploy_InProgress_Message", `Deployment ${updatedDeployment.job?.id} is in progress.`),
            NotificationType.Info
          );
          // Return to home to let user continue working
          handleBackToHome();
        }
      } else {
        console.log("Deployment dialog was cancelled");
      }
    } catch (error) {
      console.error("Error deploying package:", error);
      callNotificationOpen(
        workloadClient,
        t("ZavaTemplateItem_Template_Deploy_Error", "Deployment Error"),
        t("ZavaTemplateItem_Template_Deploy_Error_Message", `Failed to deploy: ${error.message || error}`),
        NotificationType.Error
      );
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

  if (isLoadingData) {
    return <ItemEditorLoadingProgressBar message={t("ZavaTemplateItem_Loading", "Loading...")} />;
  }

  if (!editorItem) {
    return (
      <Text>
        {t("ZavaTemplateItem_Error_NotFound", "Item not found")}
      </Text>
    );
  }

  // Show onboarding form if not onboarded
  if (!editorItem.definition.isOnboarded) {
    return (
      <div className="item-page">
        <ZavaTemplateItemEditorRibbon
          {...props}
          isRibbonDisabled={true}
          isSaveButtonEnabled={false}
          saveItemCallback={() => Promise.resolve()}
          onSettingsCallback={() => {}}
        />
        <div className="item-content">
          <ZavaTemplateItemEditorEmpty
            userName={userName}
            onOnboardingComplete={handleOnboardingComplete}
          />
        </div>
      </div>
    );
  }

  // Show template canvas if a package is selected
  if (showTemplateCanvas && selectedPackage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <ZavaTemplateItemTemplateCanvas
          package={selectedPackage}
          context={packageContext}
          onBack={handleBackToHome}
          onDeploy={handleDeployPackage}
        />
      </div>
    );
  }

  // Main solution starter experience
  return (
    <div className="item-page">
      <ZavaTemplateItemEditorRibbon
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
                "ZavaTemplateItem_Welcome_Title",
                `Welcome, ${editorItem.definition.onboardingData?.userName || "User"}!`
              )}
            </Text>
            <Text>
              {t(
                "ZavaTemplateItem_Welcome_Subtitle",
                "Access your solution resources and request data access below"
              )}
            </Text>
          </Stack>

          {/* Solution Resources */}
          <Stack tokens={{ childrenGap: 12 }}>
            <Text as="h3" size={600} weight="semibold">
              {t("ZavaTemplateItem_Resources_Title", "Solution Resources")}
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {editorItem.definition.resources?.map((resource: SolutionResource) => (
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
                      {t("ZavaTemplateItem_Resource_Open", "Open")}
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
                        "ZavaTemplateItem_DataAccess_Title",
                        "Ask for Data Access"
                      )}
                    </Text>
                  }
                  description={
                    <Text size={300}>
                      {t(
                        "ZavaTemplateItem_DataAccess_Description",
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
                          "ZavaTemplateItem_DataAccess_Request",
                          "Request Access"
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogSurface>
                      <DialogBody>
                        <DialogTitle>
                          {t(
                            "ZavaTemplateItem_DataAccess_Dialog_Title",
                            "Request Data Access"
                          )}
                        </DialogTitle>
                        <DialogContent>
                          <Stack tokens={{ childrenGap: 16 }}>
                            <Field
                              label={t(
                                "ZavaTemplateItem_DataAccess_DataSource_Label",
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
                                  "ZavaTemplateItem_DataAccess_DataSource_Placeholder",
                                  "e.g., Sales Database, Customer Analytics"
                                )}
                              />
                            </Field>
                            <Field
                              label={t(
                                "ZavaTemplateItem_DataAccess_Justification_Label",
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
                                  "ZavaTemplateItem_DataAccess_Justification_Placeholder",
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
                              {t("ZavaTemplateItem_Dialog_Cancel", "Cancel")}
                            </Button>
                          </DialogTrigger>
                          <Button
                            appearance="primary"
                            onClick={handleDataAccessRequest}
                          >
                            {t(
                              "ZavaTemplateItem_Dialog_Submit",
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

          {/* Deployments */}
          <Stack tokens={{ childrenGap: 12 }}>
            <Text as="h3" size={600} weight="semibold">
              {t("ZavaTemplateItem_Deployments_Title", "Deployments")}
            </Text>
            {editorItem.definition.deployments && editorItem.definition.deployments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>{t("ZavaTemplateItem_Deployment_Id", "Deployment ID")}</TableHeaderCell>
                    <TableHeaderCell>{t("ZavaTemplateItem_Deployment_Package", "Package")}</TableHeaderCell>
                    <TableHeaderCell>{t("ZavaTemplateItem_Deployment_Status", "Status")}</TableHeaderCell>
                    <TableHeaderCell>{t("ZavaTemplateItem_Deployment_Time", "Deployed At")}</TableHeaderCell>
                    <TableHeaderCell>{t("ZavaTemplateItem_Deployment_Workspace", "Workspace")}</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editorItem.definition.deployments.map((deployment: any) => (
                    <TableRow key={deployment.id}>
                      <TableCell>
                        <Text size={300}>{deployment.id}</Text>
                      </TableCell>
                      <TableCell>
                        <Text weight="semibold">{deployment.packageName || deployment.packageId}</Text>
                      </TableCell>
                      <TableCell>
                        <Badge
                          appearance="filled"
                          color={
                            deployment.status === 2 // DeploymentStatus.Succeeded
                              ? "success"
                              : deployment.status === 3 // DeploymentStatus.Failed
                              ? "danger"
                              : deployment.status === 1 // DeploymentStatus.InProgress
                              ? "warning"
                              : "informative" // Pending
                          }
                        >
                          {deployment.status === 0 ? "Pending" :
                           deployment.status === 1 ? "In Progress" :
                           deployment.status === 2 ? "Succeeded" :
                           deployment.status === 3 ? "Failed" : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Text size={300}>
                          {deployment.triggeredTime
                            ? new Date(deployment.triggeredTime).toLocaleString()
                            : t("ZavaTemplateItem_Deployment_NotStarted", "Not started")}
                        </Text>
                      </TableCell>
                      <TableCell>
                        {deployment.workspace?.id ? (
                          <WorkspaceDisplayNameCell
                            context={packageContext}
                            workspaceId={deployment.workspace.id}
                          />
                        ) : (
                          <Text size={300}>-</Text>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card>
                <Text size={300} style={{ fontStyle: "italic", textAlign: "center", padding: "24px" }}>
                  {t("ZavaTemplateItem_Deployments_Empty", "No packages have been deployed yet")}
                </Text>
              </Card>
            )}
          </Stack>

          {/* Data Access Requests */}
          {editorItem.definition.dataAccessRequests &&
            editorItem.definition.dataAccessRequests.length > 0 && (
              <Stack tokens={{ childrenGap: 12 }}>
                <Text as="h3" size={600} weight="semibold">
                  {t(
                    "ZavaTemplateItem_Requests_Title",
                    "Your Data Access Requests"
                  )}
                </Text>
                <Stack tokens={{ childrenGap: 8 }}>
                  {editorItem.definition.dataAccessRequests.map((request: DataAccessRequest) => (
                    <Card key={request.id}>
                      <Stack horizontal horizontalAlign="space-between">
                        <Stack tokens={{ childrenGap: 4 }}>
                          <Text weight="semibold">{request.dataSourceName}</Text>
                          <Text size={300}>{request.justification}</Text>
                          <Text size={200}>
                            {t(
                              "ZavaTemplateItem_Request_Date",
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

          {/* Template Package Selection Dialog */}
          <Dialog
            open={isTemplateDialogOpen}
            onOpenChange={(event, data) => setIsTemplateDialogOpen(data.open)}
          >
            <DialogSurface style={{ maxWidth: "90vw", width: "1200px" }}>
              <DialogBody>
                <DialogTitle>
                  {t(
                    "ZavaTemplateItem_Template_Dialog_Title",
                    "Templates & Examples"
                  )}
                </DialogTitle>
                <DialogContent>
                  <Stack tokens={{ childrenGap: 16 }}>
                    <Text>
                      {t(
                        "ZavaTemplateItem_Template_Dialog_Description",
                        "Choose a package template to deploy to your workspace:"
                      )}
                    </Text>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "16px",
                        maxHeight: "60vh",
                        overflow: "auto",
                        padding: "8px"
                      }}
                    >
                      {packageContext.packageRegistry.getPackagesArray().map((pkg: Package) => (
                        <Card
                          key={pkg.id}
                          style={{ cursor: "pointer", height: "100%" }}
                          onClick={() => handlePackageSelected(pkg.id)}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "100px",
                              padding: "16px",
                              borderBottom: "1px solid #e1dfdd"
                            }}
                          >
                            <img
                              src={pkg.icon || "/assets/items/PackageInstallerItem/PackageDefault-icon.png"}
                              alt={pkg.displayName}
                              style={{
                                width: "64px",
                                height: "64px",
                                objectFit: "cover",
                                borderRadius: "4px"
                              }}
                            />
                          </div>
                          <CardHeader
                            header={
                              <Text weight="semibold" size={500}>
                                {pkg.displayName}
                              </Text>
                            }
                            description={
                              <Text size={300}>
                                {pkg.description}
                              </Text>
                            }
                          />
                          <div style={{ padding: "0 16px 16px" }}>
                            <Button
                              appearance="primary"
                              size="small"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handlePackageSelected(pkg.id);
                              }}
                            >
                              {t("ZavaTemplateItem_Template_Select", "Select")}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button
                    appearance="secondary"
                    onClick={() => setIsTemplateDialogOpen(false)}
                  >
                    {t("ZavaTemplateItem_Dialog_Close", "Close")}
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
