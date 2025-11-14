import React, { useEffect, useState } from "react";
import { Stack } from "@fluentui/react";
import {
  Text,
  Button,
  Field,
  Input,
  Dropdown,
  Option,
  Textarea,
} from "@fluentui/react-components";
import { COST_CENTERS, DEPARTMENTS, OnboardingFormData } from "./ZavaSolutionStarterItemModel";
import "./../../styles.scss";
import { useTranslation } from "react-i18next";

interface ZavaSolutionStarterItemEmptyStateProps {
  userName?: string;
  onOnboardingComplete: (formData: OnboardingFormData) => void;
}

export const ZavaSolutionStarterItemEditorEmpty: React.FC<ZavaSolutionStarterItemEmptyStateProps> = ({
  userName,
  onOnboardingComplete,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<OnboardingFormData>({
    userName: userName || "",
    costCenter: "",
    purpose: "",
    department: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form whenever data changes
  useEffect(() => {
    const isValid =
      formData.userName.trim() !== "" &&
      formData.costCenter !== "" &&
      formData.purpose.trim() !== "" &&
      formData.department !== "";
    setIsFormValid(isValid);
  }, [formData]);

  const handleStartClick = () => {
    if (isFormValid) {
      onOnboardingComplete({
        ...formData,
        onboardedAt: new Date(),
      });
    }
  };

  return (
    <Stack
      className="empty-item-container"
      horizontalAlign="center"
      tokens={{ childrenGap: 24 }}
      styles={{ root: { padding: "40px 20px" } }}
    >
      <Stack.Item>
        <Text as="h1" size={900} weight="semibold">
          {t("ZavaSolutionStarterItem_Empty_Title", "Start Right")}
        </Text>
      </Stack.Item>
      
      <Stack.Item>
        <Text as="p" size={400}>
          {t(
            "ZavaSolutionStarterItem_Empty_Subtitle",
            "The following details are needed before using Fabric"
          )}
        </Text>
      </Stack.Item>

      <Stack
        tokens={{ childrenGap: 20 }}
        styles={{ root: { width: "100%", maxWidth: "600px", marginTop: "20px" } }}
      >
        {/* Name Field - Auto-populated */}
        <Field
          label={t("ZavaSolutionStarterItem_Empty_Name_Label", "Name")}
          required
        >
          <Input
            value={formData.userName}
            onChange={(e, data) =>
              setFormData({ ...formData, userName: data.value })
            }
            placeholder={t(
              "ZavaSolutionStarterItem_Empty_Name_Placeholder",
              "Your name"
            )}
            disabled={!!userName} // Disable if auto-populated
          />
        </Field>

        {/* Cost Center Dropdown */}
        <Field
          label={t("ZavaSolutionStarterItem_Empty_CostCenter_Label", "Cost Center")}
          required
        >
          <Dropdown
            placeholder={t(
              "ZavaSolutionStarterItem_Empty_CostCenter_Placeholder",
              "Select a cost center"
            )}
            value={formData.costCenter}
            selectedOptions={formData.costCenter ? [formData.costCenter] : []}
            onOptionSelect={(e, data) =>
              setFormData({ ...formData, costCenter: data.optionValue as string })
            }
          >
            {COST_CENTERS.map((center) => (
              <Option key={center.key} value={center.key}>
                {center.text}
              </Option>
            ))}
          </Dropdown>
        </Field>

        {/* Department Dropdown */}
        <Field
          label={t("ZavaSolutionStarterItem_Empty_Department_Label", "Department")}
          required
        >
          <Dropdown
            placeholder={t(
              "ZavaSolutionStarterItem_Empty_Department_Placeholder",
              "Select your department"
            )}
            value={formData.department}
            selectedOptions={formData.department ? [formData.department] : []}
            onOptionSelect={(e, data) =>
              setFormData({ ...formData, department: data.optionValue as string })
            }
          >
            {DEPARTMENTS.map((dept) => (
              <Option key={dept.key} value={dept.key}>
                {dept.text}
              </Option>
            ))}
          </Dropdown>
        </Field>

        {/* Purpose Text Area */}
        <Field
          label={t(
            "ZavaSolutionStarterItem_Empty_Purpose_Label",
            "Purpose of using Fabric"
          )}
          required
        >
          <Textarea
            value={formData.purpose}
            onChange={(e, data) =>
              setFormData({ ...formData, purpose: data.value })
            }
            placeholder={t(
              "ZavaSolutionStarterItem_Empty_Purpose_Placeholder",
              "Describe your intended use of Fabric..."
            )}
            rows={4}
          />
        </Field>

        {/* Start Button */}
        <Stack.Item styles={{ root: { marginTop: "20px" } }}>
          <Button
            appearance="primary"
            size="large"
            onClick={handleStartClick}
            disabled={!isFormValid}
          >
            {t("ZavaSolutionStarterItem_Empty_Start_Button", "Start")}
          </Button>
        </Stack.Item>
      </Stack>
    </Stack>
  );
};
