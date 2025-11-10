import React, { useState, useMemo } from "react";
import { View, TextInput, Pressable, SectionList, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "../../theme";
import { spacing } from "../../theme/spacing";
import TText from "../TText";
import BottomSheet from "../BottomSheet";
import Ionicons from "@expo/vector-icons/Ionicons";

// Comprehensive list of countries
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
].sort();

// Group countries by first letter
function groupCountriesByLetter(countries) {
  const grouped = {};
  countries.forEach((country) => {
    const firstLetter = country[0].toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(country);
  });
  return Object.keys(grouped)
    .sort()
    .map((letter) => ({
      title: letter,
      data: grouped[letter],
    }));
}

export default function CountryPickerSheet({ visible, onClose, onConfirm, initialValue }) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const groupedCountries = useMemo(() => {
    const filtered = searchQuery
      ? COUNTRIES.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
      : COUNTRIES;
    return searchQuery ? [{ title: "Results", data: filtered }] : groupCountriesByLetter(filtered);
  }, [searchQuery]);

  const handleSelect = (country) => {
    onConfirm(country);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="80%">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
          <TText weight="bold" style={{ fontSize: 20, marginBottom: spacing.md, color: colors.text.primary }}>
            Select Country
          </TText>

          {/* Search bar */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.bg.layer2, borderRadius: 12, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="search" size={20} color={colors.text.muted} style={{ marginRight: spacing.sm }} />
              <TextInput
                placeholder="Search country..."
                placeholderTextColor={colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, color: colors.text.primary, paddingVertical: spacing.sm }}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={colors.text.muted} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Country list - Full width */}
          <View style={{ flex: 1, minHeight: 300 }}>
            <SectionList
              sections={groupedCountries}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={{
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    backgroundColor: initialValue === item ? colors.bg.layer2 : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <TText
                    weight={initialValue === item ? "bold" : "normal"}
                    style={{ 
                      color: initialValue === item ? colors.accent.primary : colors.text.primary,
                      fontSize: 16,
                    }}
                  >
                    {item}
                  </TText>
                </Pressable>
              )}
              renderSectionHeader={({ section: { title } }) => (
                <View style={{ 
                  backgroundColor: colors.bg.layer2, 
                  paddingVertical: spacing.sm, 
                  paddingHorizontal: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <TText weight="bold" size="sm" style={{ color: colors.text.muted }}>
                    {title}
                  </TText>
                </View>
              )}
              style={{ flex: 1 }}
              contentContainerStyle={{ 
                paddingBottom: spacing.xl,
                flexGrow: 1,
              }}
              stickySectionHeadersEnabled
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

