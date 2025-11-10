import React, { useMemo, useRef, useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import SafeBottomBar from "../../src/components/SafeBottomBar";
import TText from "../../src/components/TText";
import AuthBackground from "../../src/components/auth/AuthBackground";
import AuthCard from "../../src/components/auth/AuthCard";
import ProgressSteps from "../../src/components/auth/ProgressSteps";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  auth,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
} from "../../src/services/firebase";
import { checkUserExists, createUser } from "../../src/services/userApi";
import { saveFirebaseSession } from "../../src/auth/firebaseSession";
import DatePickerSheet from "../../src/components/pickers/DatePickerSheet";
import GenderPickerSheet from "../../src/components/pickers/GenderPickerSheet";
import CountryPickerSheet from "../../src/components/pickers/CountryPickerSheet";

// tiny debounce
function useDebounced(fn, delay=400) {
  const t = useRef(null);
  return (...args) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  };
}

export default function RegisterScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const total = 4;

  // Step 1
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // availability hints
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);

  // Step 2
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [dob, setDob] = useState(""); // ISO yyyy-mm-dd string for now
  const [gender, setGender] = useState(""); // "male"/"female"/"secret"
  const [country, setCountry] = useState("");

  // Step 3
  const [displayName, setDisplayName] = useState("");

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const isEmailValid = useMemo(() => {
    return email && emailRegex.test(email.trim());
  }, [email]);

  const debouncedEmailCheck = useDebounced(async (val) => {
    if (!val || !val.trim()) {
      setEmailTaken(false);
      setEmailChecked(false);
      return;
    }
    // Only check if email format is valid
    if (!emailRegex.test(val.trim())) {
      setEmailTaken(false);
      setEmailChecked(false);
      return;
    }
    try {
      setCheckingEmail(true);
      setEmailChecked(false);
      const res = await checkUserExists({ email: val.trim() });
      setEmailTaken(Boolean(res?.exists));
      setEmailChecked(true);
    } catch (e) {
      console.error("Email check failed:", e);
      setEmailChecked(false);
    } finally {
      setCheckingEmail(false);
    }
  });

  const debouncedUsernameCheck = useDebounced(async (val) => {
    if (!val || !val.trim()) {
      setUsernameTaken(false);
      setUsernameChecked(false);
      return;
    }
    // Only check if username meets format requirements
    const trimmed = val.trim();
    const hasLength = trimmed.length >= 6;
    const isValidFormat = /^[a-z0-9_]+$/.test(trimmed);
    if (!hasLength || !isValidFormat) {
      setUsernameTaken(false);
      setUsernameChecked(false);
      return;
    }
    try {
      setCheckingUsername(true);
      setUsernameChecked(false);
      const res = await checkUserExists({ username: trimmed });
      setUsernameTaken(Boolean(res?.exists));
      setUsernameChecked(true);
    } catch (e) {
      console.error("Username check failed:", e);
      setUsernameChecked(false);
    } finally {
      setCheckingUsername(false);
    }
  });

  // Username requirements validation
  const usernameRequirements = useMemo(() => {
    const hasLength = username.length >= 6;
    const isValidFormat = /^[a-z0-9_]+$/.test(username);
    return { hasLength, isValidFormat };
  }, [username]);

  // Password requirements validation
  const passwordRequirements = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    return { hasLength, hasLowercase, hasUppercase };
  }, [password]);

  const passwordsMatch = useMemo(() => {
    return password && confirmPassword && password === confirmPassword;
  }, [password, confirmPassword]);

  const isPasswordValid = useMemo(() => {
    const { hasLength, hasLowercase, hasUppercase } = passwordRequirements;
    return hasLength && hasLowercase && hasUppercase;
  }, [passwordRequirements]);

  const isUsernameValid = useMemo(() => {
    const { hasLength, isValidFormat } = usernameRequirements;
    return hasLength && isValidFormat;
  }, [usernameRequirements]);

  const canStep1 = useMemo(() => {
    return (
      !!email &&
      !!username &&
      isEmailValid &&
      isUsernameValid &&
      !emailTaken &&
      !usernameTaken &&
      emailChecked &&
      usernameChecked
    );
  }, [email, username, isEmailValid, isUsernameValid, emailTaken, usernameTaken, emailChecked, usernameChecked]);

  const canStep2 = useMemo(() => {
    return (
      !!password &&
      !!confirmPassword &&
      isPasswordValid &&
      passwordsMatch
    );
  }, [password, confirmPassword, isPasswordValid, passwordsMatch]);

  const canStep3 = useMemo(() => {
    // Require at least firstName and lastName, plus at least one more field (dob, gender, or country)
    const hasBasicInfo = !!(firstName?.trim() && lastName?.trim());
    const hasAdditionalInfo = !!(dob && gender && country);
    return hasBasicInfo && hasAdditionalInfo;
  }, [firstName, lastName, dob, gender, country]);

  const onNext = () => {
    if (step === 1 && !canStep1) return;
    if (step === 2 && !canStep2) return;
    if (step === 3 && !canStep3) return;
    if (step < total) setStep(step + 1);
  };
  const onBack = () => setStep(Math.max(1, step - 1));

  const onFinish = async () => {
    setError("");
    let firebaseUser = null;
    
    try {
      setBusy(true);

      // Step 1: Create user in Firebase
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      firebaseUser = cred.user;

      // Step 2: Optional: set Firebase displayName for quick UX
      try {
        await updateProfile(firebaseUser, { displayName: displayName?.trim() || username.trim() });
      } catch (profileError) {
        console.warn("Failed to update Firebase profile:", profileError);
        // Non-critical, continue
      }

      // Step 3: Create user in Traversium backend
      // Note: The user is automatically signed in after Firebase creation,
      // so the http function will automatically get the ID token from auth.currentUser
      const dto = {
        userId: null,
        username: username.trim(),
        email: email.trim(),
        displayName: (displayName?.trim() || username.trim()),
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        countryOfOrigin: country || null,
        gender: gender || null,
        description: null,
        firebaseId: firebaseUser.uid,
        // server populates createdAt
      };
      
      try {
        // The http function will automatically add the Bearer token from auth.currentUser
        // which is now set since we just created the user
        await createUser(dto);
      } catch (traversiumError) {
        // Transaction rollback: If Traversium creation fails, delete Firebase user
        console.error("Traversium user creation failed, rolling back Firebase user:", traversiumError);
        try {
          await deleteUser(firebaseUser);
        } catch (deleteError) {
          console.error("Failed to delete Firebase user during rollback:", deleteError);
          // Still throw the original error
        }
        throw traversiumError;
      }

      // Step 4: Persist session token locally (only if both succeeded)
      await saveFirebaseSession(firebaseUser);

      // Step 5: Navigate to app
      router.replace("/");
    } catch (e) {
      // If Firebase creation failed, firebaseUser will be null, so no rollback needed
      // If Traversium creation failed, we already rolled back Firebase user above
      const errorMessage = e.message || "Registration failed";
      setError(errorMessage);
      console.error("Registration error:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthBackground source={require("../../assets/auth_header.jpg")}>
      <View style={{ alignItems: "center", marginTop: 54 }}>
        <TText weight="bold" style={{ fontSize: 28, letterSpacing: 2 }}>TRAVERSIUM</TText>
      </View>

      <AuthCard style={{ marginTop: 24, flex: 1, maxHeight: "75%" }}>
        <View style={{ flex: 1, position: "relative" }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View>
              <ProgressSteps total={total} current={step} />

              {step === 1 && (
                <>
                  <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                    <TText weight="bold" style={{ fontSize: 20 }}>Create your account</TText>
                    <TText dim size="sm">Step 1 of {total}</TText>
                  </View>
                  {!!error && <TText style={{ color: colors.status.danger }} size="sm">{error}</TText>}

                  <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                    {/* Email Input */}
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", position: "relative" }}>
                        <TextInput
                          placeholder="Email"
                          placeholderTextColor={colors.text.muted}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          value={email}
                          onChangeText={(v) => { 
                            setEmail(v); 
                            setEmailChecked(false); 
                            if (emailRegex.test(v.trim())) {
                              debouncedEmailCheck(v);
                            }
                          }}
                          style={{
                            flex: 1,
                            borderWidth: 2,
                            borderColor: email && !isEmailValid
                              ? colors.status.danger
                              : emailChecked
                                ? (emailTaken ? colors.status.danger : colors.status.success)
                                : colors.border,
                            borderRadius: 12,
                            padding: 12,
                            paddingRight: 40,
                            color: colors.text.primary,
                          }}
                        />
                        {emailChecked && (
                          <View style={{ position: "absolute", right: 12 }}>
                            <Ionicons
                              name={emailTaken ? "close-circle" : "checkmark-circle"}
                              size={20}
                              color={emailTaken ? colors.status.danger : colors.status.success}
                            />
                          </View>
                        )}
                        {checkingEmail && (
                          <View style={{ position: "absolute", right: 12 }}>
                            <ActivityIndicator size="small" color={colors.text.muted} />
                          </View>
                        )}
                      </View>
                      {/* Tooltip - always reserve space */}
                      <View style={{ height: 24, marginTop: 4, justifyContent: "center" }}>
                        {email && !isEmailValid && (
                          <TText 
                            size="xs" 
                            style={{ 
                              color: colors.status.danger,
                              textAlign: "left"
                            }}
                          >
                            Please enter a valid email address
                          </TText>
                        )}
                        {emailChecked && email && isEmailValid && (
                          <TText 
                            size="xs" 
                            style={{ 
                              color: emailTaken ? colors.status.danger : colors.status.success,
                              textAlign: "left"
                            }}
                          >
                            {emailTaken ? "Email already in use" : "Email available"}
                          </TText>
                        )}
                      </View>
                    </View>

                    {/* Username Input */}
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", position: "relative" }}>
                        <TextInput
                          placeholder="Username"
                          placeholderTextColor={colors.text.muted}
                          autoCapitalize="none"
                          value={username}
                          onChangeText={(v) => { setUsername(v); setUsernameChecked(false); debouncedUsernameCheck(v); }}
                          style={{
                            flex: 1,
                            borderWidth: 2,
                            borderColor: usernameChecked
                              ? (usernameTaken ? colors.status.danger : colors.status.success)
                              : colors.border,
                            borderRadius: 12,
                            padding: 12,
                            paddingRight: 40,
                            color: colors.text.primary,
                          }}
                        />
                        {usernameChecked && (
                          <View style={{ position: "absolute", right: 12 }}>
                            <Ionicons
                              name={usernameTaken ? "close-circle" : "checkmark-circle"}
                              size={20}
                              color={usernameTaken ? colors.status.danger : colors.status.success}
                            />
                          </View>
                        )}
                        {checkingUsername && (
                          <View style={{ position: "absolute", right: 12 }}>
                            <ActivityIndicator size="small" color={colors.text.muted} />
                          </View>
                        )}
                      </View>
                      {/* Tooltip - always reserve space */}
                      <View style={{ height: 24, marginTop: 4, justifyContent: "center" }}>
                        {usernameChecked && username && (
                          <TText 
                            size="xs" 
                            style={{ 
                              color: usernameTaken ? colors.status.danger : colors.status.success,
                              textAlign: "left"
                            }}
                          >
                            {usernameTaken ? "Username already taken" : "Username available"}
                          </TText>
                        )}
                      </View>
                      {/* Username Requirements - Always visible */}
                      <View style={{ marginTop: spacing.sm, gap: 4 }}>
                        <TText size="xs" style={{ color: usernameRequirements.hasLength ? colors.status.success : colors.text.muted }}>
                          {usernameRequirements.hasLength ? "✓" : "○"} At least 6 characters
                        </TText>
                        <TText size="xs" style={{ color: usernameRequirements.isValidFormat ? colors.status.success : colors.text.muted }}>
                          {usernameRequirements.isValidFormat ? "✓" : "○"} Only lowercase letters, numbers, and _
                        </TText>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {step === 2 && (
                <>
                  <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                    <TText weight="bold" style={{ fontSize: 20 }}>Set your password</TText>
                    <TText dim size="sm">Step 2 of {total}</TText>
                  </View>
                  {!!error && <TText style={{ color: colors.status.danger }} size="sm">{error}</TText>}

                  <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                    {/* Password Input */}
                    <View>
                      <TextInput
                        placeholder="Password"
                        placeholderTextColor={colors.text.muted}
                        autoCapitalize="none"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        style={{
                          borderWidth: 1,
                          borderColor: password && isPasswordValid ? colors.status.success : colors.border,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text.primary,
                        }}
                      />
                    </View>

                    {/* Confirm Password Input */}
                    <View>
                      <TextInput
                        placeholder="Confirm Password"
                        placeholderTextColor={colors.text.muted}
                        autoCapitalize="none"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        style={{
                          borderWidth: 2,
                          borderColor: confirmPassword
                            ? (passwordsMatch ? colors.status.success : colors.status.danger)
                            : colors.border,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text.primary,
                        }}
                      />
                      {/* Tooltip - always reserve space */}
                      <View style={{ height: 24, marginTop: 4, justifyContent: "center" }}>
                        {confirmPassword && (
                          <TText 
                            size="xs" 
                            style={{ 
                              color: passwordsMatch ? colors.status.success : colors.status.danger,
                              textAlign: "left"
                            }}
                          >
                            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                          </TText>
                        )}
                      </View>
                      {/* Password Requirements - Always visible */}
                      <View style={{ marginTop: spacing.sm, gap: 4 }}>
                        <TText size="xs" style={{ color: passwordRequirements.hasLength ? colors.status.success : colors.text.muted }}>
                          {passwordRequirements.hasLength ? "✓" : "○"} At least 8 characters
                        </TText>
                        <TText size="xs" style={{ color: passwordRequirements.hasLowercase ? colors.status.success : colors.text.muted }}>
                          {passwordRequirements.hasLowercase ? "✓" : "○"} One lowercase letter
                        </TText>
                        <TText size="xs" style={{ color: passwordRequirements.hasUppercase ? colors.status.success : colors.text.muted }}>
                          {passwordRequirements.hasUppercase ? "✓" : "○"} One uppercase letter
                        </TText>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {step === 3 && (
                <>
                  <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                    <TText weight="bold" style={{ fontSize: 20 }}>Tell us about you</TText>
                    <TText dim size="sm">Step 3 of {total}</TText>
                  </View>
                  <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                    <TextInput 
                      placeholder="First Name" 
                      placeholderTextColor={colors.text.muted} 
                      value={firstName} 
                      onChangeText={setFirst}
                      style={{ borderWidth:1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text.primary }} 
                    />
                    <TextInput 
                      placeholder="Last Name" 
                      placeholderTextColor={colors.text.muted} 
                      value={lastName} 
                      onChangeText={setLast}
                      style={{ borderWidth:1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text.primary }} 
                    />
                    
                    {/* Date of Birth Picker */}
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <TText style={{ color: dob ? colors.text.primary : colors.text.muted }}>
                        {dob ? (() => {
                          const [y, m, d] = dob.split("-");
                          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                          return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
                        })() : "Date of Birth"}
                      </TText>
                      <Ionicons name="calendar-outline" size={20} color={colors.text.muted} />
                    </Pressable>

                    {/* Gender Picker */}
                    <Pressable
                      onPress={() => setShowGenderPicker(true)}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <TText style={{ color: gender ? colors.text.primary : colors.text.muted }}>
                        {gender === "male" ? "Male" : gender === "female" ? "Female" : gender === "secret" ? "It's a secret" : "Gender"}
                      </TText>
                      <Ionicons 
                        name={gender === "male" ? "male" : gender === "female" ? "female" : "lock-closed-outline"} 
                        size={20} 
                        color={gender ? colors.accent.primary : colors.text.muted} 
                      />
                    </Pressable>

                    {/* Country Picker */}
                    <Pressable
                      onPress={() => setShowCountryPicker(true)}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <TText style={{ color: country ? colors.text.primary : colors.text.muted }}>
                        {country || "Country of origin"}
                      </TText>
                      <Ionicons name="globe-outline" size={20} color={colors.text.muted} />
                    </Pressable>
                  </View>
                </>
              )}

              {step === 4 && (
                <>
                  <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                    <TText weight="bold" style={{ fontSize: 20 }}>Choose how friends see you</TText>
                    <TText dim size="sm">Step 4 of {total}</TText>
                  </View>
                  <TText dim size="sm">Welcome {username || "traveler"}! How should friends see your name?</TText>
                  <TextInput
                    placeholder={`Display Name (defaults to "${username || "username"}")`}
                    placeholderTextColor={colors.text.muted}
                    value={displayName}
                    onChangeText={setDisplayName}
                    style={{ marginTop: spacing.sm, borderWidth:1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text.primary }}
                  />

                  {!!error && <TText style={{ color: colors.status.danger, marginTop: spacing.sm }} size="sm">{error}</TText>}
                </>
              )}
            </View>
          </ScrollView>

          {/* Bottom buttons - Always visible, pinned at bottom */}
          <View style={{ 
            position: "absolute", 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: colors.bg.layer1,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: spacing.sm 
          }}>
            {step === 1 && (
              <>
                <Pressable onPress={() => router.replace("/(auth)/login")} style={{ alignItems: "center", paddingVertical: spacing.sm }}>
                  <TText dim>Have an account? Sign in</TText>
                </Pressable>
                <Pressable onPress={onNext} disabled={!canStep1} style={{ borderRadius: 14, overflow: "hidden" }}>
                  <LinearGradient
                    colors={[canStep1 ? colors.accent.primary : colors.bg.layer3, canStep1 ? colors.accent.primary : colors.bg.layer3]}
                    style={{ padding: 14, alignItems: "center" }}
                  >
                    <TText style={{ color: canStep1 ? "#fff" : colors.text.muted }}>Next</TText>
                  </LinearGradient>
                </Pressable>
              </>
            )}

            {step === 2 && (
              <View style={{ flexDirection: "row", justifyContent:"space-between" }}>
                <Pressable onPress={onBack} style={{ padding: 12 }}>
                  <TText>Back</TText>
                </Pressable>
                <Pressable onPress={onNext} disabled={!canStep2} style={{ borderRadius: 14, overflow: "hidden", minWidth: 110 }}>
                  <LinearGradient
                    colors={[canStep2 ? colors.accent.primary : colors.bg.layer3, canStep2 ? colors.accent.primary : colors.bg.layer3]}
                    style={{ padding: 12, alignItems: "center" }}
                  >
                    <TText style={{ color: canStep2 ? "#fff" : colors.text.muted }}>Next</TText>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {step === 3 && (
              <View style={{ flexDirection: "row", justifyContent:"space-between" }}>
                <Pressable onPress={onBack} style={{ padding: 12 }}>
                  <TText>Back</TText>
                </Pressable>
                <Pressable onPress={onNext} disabled={!canStep3} style={{ borderRadius: 14, overflow: "hidden", minWidth: 110 }}>
                  <LinearGradient
                    colors={[canStep3 ? colors.accent.primary : colors.bg.layer3, canStep3 ? colors.accent.primary : colors.bg.layer3]}
                    style={{ padding: 12, alignItems: "center" }}
                  >
                    <TText style={{ color: canStep3 ? "#fff" : colors.text.muted }}>Next</TText>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {step === 4 && (
              <View style={{ flexDirection: "row", justifyContent:"space-between" }}>
                <Pressable onPress={onBack} style={{ padding: 12 }}>
                  <TText>Back</TText>
                </Pressable>
                <Pressable onPress={onFinish} disabled={busy} style={{ borderRadius: 14, overflow: "hidden", minWidth: 120 }}>
                  <LinearGradient
                    colors={[colors.accent.primary, colors.accent.primary]}
                    style={{ padding: 12, alignItems: "center" }}
                  >
                    {busy ? <ActivityIndicator color="#fff" /> : <TText style={{ color: "#fff" }}>Finish</TText>}
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </AuthCard>

      <View style={{ alignItems:"center", marginTop: spacing.lg }}>
        <TText dim size="sm">© {new Date().getFullYear()} Traversium</TText>
        <SafeBottomBar backgroundColor={colors.bg.layer1} />
      </View>

      {/* Pickers */}
      <DatePickerSheet
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={setDob}
        initialDate={dob}
      />
      <GenderPickerSheet
        visible={showGenderPicker}
        onClose={() => setShowGenderPicker(false)}
        onConfirm={setGender}
        initialValue={gender}
      />
      <CountryPickerSheet
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onConfirm={setCountry}
        initialValue={country}
      />
    </AuthBackground>
  );
}
