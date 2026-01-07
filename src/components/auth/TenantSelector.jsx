import React, { useState, useEffect } from "react";
import { View, TextInput, Pressable, Modal, ActivityIndicator } from "react-native";
import { useTheme } from "../../theme";
import { spacing } from "../../theme/spacing";
import TText from "../TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getTenantByName } from "../../services/tenantApi";
import { getTenantName, setTenantId } from "../../utils/tenantStorage";

const OFFICIAL_TENANTS = [
  { id: "public", name: "Official Traversium" },
  // Add more official tenants here if needed
];

export default function TenantSelector({ tenantId, onTenantChange, style }) {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [customTenantName, setCustomTenantName] = useState("");
  const [storedTenantName, setStoredTenantName] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOfficialTenant = OFFICIAL_TENANTS.some((t) => t.id === tenantId);

  // Load stored tenant name on mount
  useEffect(() => {
    if (!isOfficialTenant && tenantId !== "public") {
      getTenantName().then((name) => {
        if (name) {
          setStoredTenantName(name);
        }
      });
    }
  }, [tenantId, isOfficialTenant]);

  const handleSelectOfficial = async (tenant) => {
    onTenantChange(tenant.id);
    setIsCustomMode(false);
    setStoredTenantName(null);
    await setTenantId(tenant.id, null); // Clear tenant name for official tenant
    setShowModal(false);
    setError("");
  };

    const handleSelectCustom = async () => {
    if (!customTenantName.trim()) {
      setError("Please enter a tenant name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch tenant ID from API using tenant name
      const tenant = await getTenantByName(customTenantName.trim());
      // Use the firebaseTenantId (Firebase-generated tenant ID) for authentication
      // Fallback to tenantId if firebaseTenantId is not available (for backwards compatibility)
      const firebaseTenantId = tenant.firebaseTenantId || tenant.tenantId;
      if (!firebaseTenantId) {
        throw new Error("Tenant does not have a Firebase tenant ID");
      }
      // Store both the tenant ID and name
      await setTenantId(firebaseTenantId, tenant.name);
      setStoredTenantName(tenant.name);
      onTenantChange(firebaseTenantId);
      setIsCustomMode(true);
      setShowModal(false);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to find tenant");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (isOfficialTenant) {
      setCustomTenantName("");
    } else {
      // If it's a custom tenant, we don't know the name, so leave it empty
      setCustomTenantName("");
      setIsCustomMode(true);
    }
    setError("");
    setShowModal(true);
  };

  const getDisplayName = () => {
    if (tenantId === "public") {
      return "Official Traversium";
    }
    const official = OFFICIAL_TENANTS.find((t) => t.id === tenantId);
    if (official) {
      return official.name;
    }
    // Show stored tenant name if available, otherwise show generic text
    return storedTenantName || "Custom Tenant";
  };

  return (
    <>
      <Pressable
        onPress={handleOpenModal}
        style={[
          {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.bg.layer2,
          },
          style,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <Ionicons name="server-outline" size={20} color={colors.text.primary} />
          <View style={{ flex: 1 }}>
            <TText size="xs" dim style={{ marginBottom: 2 }}>
              Server
            </TText>
            <TText style={{ fontSize: 14 }} numberOfLines={1}>
              {getDisplayName()}
            </TText>
          </View>
        </View>
        <Ionicons name="chevron-down-outline" size={20} color={colors.text.muted} />
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowModal(false)}
          />
          <View
            style={{
              backgroundColor: colors.bg.layer1,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: spacing.lg,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.lg,
              }}
            >
              <TText weight="bold" style={{ fontSize: 20 }}>
                Select Server
              </TText>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <View style={{ gap: spacing.md }}>
              {/* Official Tenants */}
              <View>
                <TText dim size="sm" style={{ marginBottom: spacing.sm }}>
                  Official Servers
                </TText>
                {OFFICIAL_TENANTS.map((tenant) => (
                  <Pressable
                    key={tenant.id}
                    onPress={() => handleSelectOfficial(tenant)}
                    style={{
                      padding: spacing.md,
                      borderRadius: 12,
                      backgroundColor:
                        tenantId === tenant.id
                          ? colors.accent.primary + "20"
                          : colors.bg.layer2,
                      borderWidth: tenantId === tenant.id ? 2 : 1,
                      borderColor:
                        tenantId === tenant.id
                          ? colors.accent.primary
                          : colors.border,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Ionicons
                        name={tenantId === tenant.id ? "checkmark-circle" : "server"}
                        size={20}
                        color={
                          tenantId === tenant.id
                            ? colors.accent.primary
                            : colors.text.primary
                        }
                      />
                      <TText
                        style={{
                          color:
                            tenantId === tenant.id
                              ? colors.accent.primary
                              : colors.text.primary,
                        }}
                      >
                        {tenant.name}
                      </TText>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Custom Tenant Input */}
              <View>
                <TText dim size="sm" style={{ marginBottom: spacing.sm }}>
                  Custom Tenant
                </TText>
                <View style={{ gap: spacing.sm }}>
                  <TextInput
                    placeholder="Enter tenant name (e.g., mycompany)"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="none"
                    value={customTenantName}
                    onChangeText={(text) => {
                      setCustomTenantName(text);
                      setError("");
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor: error ? colors.status.danger : colors.border,
                      borderRadius: 12,
                      padding: 12,
                      color: colors.text.primary,
                      backgroundColor: colors.bg.layer2,
                    }}
                  />
                  {error && (
                    <TText size="xs" style={{ color: colors.status.danger }}>
                      {error}
                    </TText>
                  )}
                  <Pressable
                    onPress={handleSelectCustom}
                    disabled={!customTenantName.trim() || loading}
                    style={{
                      borderRadius: 12,
                      padding: 14,
                      backgroundColor: customTenantName.trim() && !loading
                        ? colors.accent.primary
                        : colors.bg.layer3,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: spacing.sm,
                    }}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <TText style={{ color: "#fff" }}>Looking up...</TText>
                      </>
                    ) : (
                      <TText
                        style={{
                          color: customTenantName.trim() ? "#fff" : colors.text.muted,
                        }}
                      >
                        Use Custom Tenant
                      </TText>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

