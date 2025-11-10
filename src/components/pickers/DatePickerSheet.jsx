import React, { useState, useRef, useEffect } from "react";
import { View, ScrollView, Pressable, Dimensions } from "react-native";
import { useTheme } from "../../theme";
import { spacing } from "../../theme/spacing";
import TText from "../TText";
import BottomSheet from "../BottomSheet";
import { LinearGradient } from "expo-linear-gradient";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDaysInMonth(year, month) {
  if (month === 1 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month];
}

export default function DatePickerSheet({ visible, onClose, onConfirm, initialDate }) {
  const { colors } = useTheme();
  const yearScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);
  
  // Parse initial date or use current date
  const parseDate = (dateStr) => {
    if (!dateStr) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
    }
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1,
        day: parseInt(parts[2], 10),
      };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  };

  const initial = parseDate(initialDate);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const maxDay = getDaysInMonth(year, month);

  // Adjust day if it exceeds max days in selected month
  const adjustedDay = Math.min(day, maxDay);

  // Animate year picker when year changes
  useEffect(() => {
    if (yearScrollRef.current) {
      const yearIndex = years.indexOf(year);
      if (yearIndex >= 0) {
        setTimeout(() => {
          yearScrollRef.current?.scrollTo({ y: yearIndex * 40, animated: true });
        }, 50);
      }
    }
  }, [year, years]);

  // Animate month picker when month changes
  useEffect(() => {
    if (monthScrollRef.current) {
      setTimeout(() => {
        monthScrollRef.current?.scrollTo({ y: month * 40, animated: true });
      }, 50);
    }
  }, [month]);

  // Update day when month or year changes
  useEffect(() => {
    const newMaxDay = getDaysInMonth(year, month);
    if (day > newMaxDay) {
      setDay(newMaxDay);
    }
    // Scroll day picker to adjusted position
    if (dayScrollRef.current) {
      const newAdjustedDay = Math.min(day, newMaxDay);
      setTimeout(() => {
        dayScrollRef.current?.scrollTo({ y: (newAdjustedDay - 1) * 40, animated: true });
      }, 50);
    }
  }, [year, month, day]);

  // Scroll to initial values when sheet opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        const yearIndex = years.indexOf(year);
        if (yearScrollRef.current && yearIndex >= 0) {
          yearScrollRef.current.scrollTo({ y: yearIndex * 40, animated: false });
        }
        if (monthScrollRef.current) {
          monthScrollRef.current.scrollTo({ y: month * 40, animated: false });
        }
        if (dayScrollRef.current) {
          dayScrollRef.current.scrollTo({ y: (adjustedDay - 1) * 40, animated: false });
        }
      }, 100);
    }
  }, [visible, year, month, adjustedDay, years]);

  const handleConfirm = () => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;
    onConfirm(dateStr);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="60%">
      <View style={{ paddingHorizontal: spacing.xl }}>
        <TText weight="bold" style={{ fontSize: 20, marginBottom: spacing.md }}>
          Select Date of Birth
        </TText>

        {/* Picker sliders */}
        <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl, height: 200 }}>
          {/* Year */}
          <View style={{ flex: 1 }}>
            <TText dim size="sm" style={{ marginBottom: spacing.xs, textAlign: "center" }}>Year</TText>
            <ScrollView
              ref={yearScrollRef}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 80 }}
              snapToInterval={40}
              decelerationRate="fast"
            >
              {years.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => {
                    setYear(y);
                  }}
                  style={{
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: y === year ? colors.bg.layer2 : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <TText 
                    weight={y === year ? "bold" : "normal"}
                    style={{ 
                      color: y === year ? colors.accent.primary : colors.text.muted,
                      fontSize: y === year ? 16 : 14,
                    }}
                  >
                    {y}
                  </TText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Month */}
          <View style={{ flex: 1 }}>
            <TText dim size="sm" style={{ marginBottom: spacing.xs, textAlign: "center" }}>Month</TText>
            <ScrollView
              ref={monthScrollRef}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 80 }}
              snapToInterval={40}
              decelerationRate="fast"
            >
              {MONTHS.map((m, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setMonth(idx)}
                  style={{
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: idx === month ? colors.bg.layer2 : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <TText 
                    weight={idx === month ? "bold" : "normal"}
                    style={{ 
                      color: idx === month ? colors.accent.primary : colors.text.muted,
                      fontSize: idx === month ? 16 : 14,
                    }}
                  >
                    {m.substring(0, 3)}
                  </TText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Day */}
          <View style={{ flex: 1 }}>
            <TText dim size="sm" style={{ marginBottom: spacing.xs, textAlign: "center" }}>Day</TText>
            <ScrollView
              ref={dayScrollRef}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 80 }}
              snapToInterval={40}
              decelerationRate="fast"
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDay(d)}
                  style={{
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: d === adjustedDay ? colors.bg.layer2 : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <TText 
                    weight={d === adjustedDay ? "bold" : "normal"}
                    style={{ 
                      color: d === adjustedDay ? colors.accent.primary : colors.text.muted,
                      fontSize: d === adjustedDay ? 16 : 14,
                    }}
                  >
                    {d}
                  </TText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Selected date display */}
        <View style={{
          backgroundColor: colors.bg.layer2,
          padding: spacing.md,
          borderRadius: 12,
          marginBottom: spacing.md,
          alignItems: "center",
        }}>
          <TText weight="bold" style={{ fontSize: 18 }}>
            {MONTHS[month]} {adjustedDay}, {year}
          </TText>
        </View>

        {/* Confirm button */}
        <Pressable onPress={handleConfirm} style={{ borderRadius: 14, overflow: "hidden" }}>
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primary]}
            style={{ padding: 14, alignItems: "center" }}
          >
            <TText style={{ color: "#fff" }}>Confirm</TText>
          </LinearGradient>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

