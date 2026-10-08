import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLayout } from "../components/AppLayout";
import { locationShareController } from "../controllers/locationShareController";
import { protectionController } from "../controllers/protectionController";
import { safeHavenController } from "../controllers/safeHavenController";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import {
  situationAIService,
  type SafetySuggestionType
} from "../services/situationAIService";
import { ensureSafetyStoreHydrated } from "../state/hydration";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SituationAIScreen">;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  lines: string[];
  suggestions: SafetySuggestionType[];
};

const createMessageId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const quickPromptChips = [
  "Someone is following me",
  "I feel unsafe in a cab",
  "I'm alone at night",
  "Someone is watching me"
];

const suggestionLabel: Record<SafetySuggestionType, string> = {
  fake_call: "Fake Call",
  share_location: "Share Location",
  safe_haven: "Find Safe Haven",
  protection_mode: "Protection Mode",
  trusted_contact: "Call Trusted Contact"
};

export const SituationAIScreen = ({ navigation }: Props) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const [inputText, setInputText] = useState("");
  const [hydratingStore, setHydratingStore] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [inputValidationMessage, setInputValidationMessage] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      role: "assistant",
      lines: [
        "Tell me what is happening. I will suggest immediate safety steps.",
        `Knowledge base ready: ${situationAIService.totalScenarios} incident scenarios.`,
        "You can mention concerns like stalking, unsafe ride, harassment, hotel, ATM, or suspicious strangers."
      ],
      suggestions: ["fake_call", "share_location", "safe_haven"]
    }
  ]);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        await ensureSafetyStoreHydrated();
      } finally {
        if (mounted) {
          setHydratingStore(false);
        }
      }
    };

    hydrate().catch(() => {
      if (mounted) {
        setHydratingStore(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const lastAssistantSuggestions = useMemo(() => {
    const reversed = [...messages].reverse();
    const assistantMessage = reversed.find((message) => message.role === "assistant");
    return assistantMessage?.suggestions ?? [];
  }, [messages]);

  const appendAssistantMessage = (lines: string[], suggestions: SafetySuggestionType[]) => {
    setMessages((previous) => [
      ...previous,
      {
        id: createMessageId(),
        role: "assistant",
        lines,
        suggestions
      }
    ]);
  };

  const processUserMessage = (rawInput: string) => {
    const rawText = rawInput.trim();
    if (!rawText) {
      setInputValidationMessage("Please describe what is happening so I can help you.");
      return;
    }

    setInputValidationMessage(null);

    const analysis = situationAIService.analyzeInput(rawText);
    const lines = analysis.lines.length
      ? analysis.lines
      : [
          "I'm not fully sure about that situation, but here are some actions that can help keep you safe.",
          "- Use Fake Call",
          "- Share your location",
          "- Go to the nearest Safe Haven"
        ];

    const suggestions: SafetySuggestionType[] = analysis.suggestions.length
      ? analysis.suggestions
      : ["fake_call", "share_location", "safe_haven"];

    setMessages((previous): ChatMessage[] => [
      ...previous,
      {
        id: createMessageId(),
        role: "user",
        lines: [rawText],
        suggestions: []
      },
      {
        id: createMessageId(),
        role: "assistant",
        lines,
        suggestions
      }
    ]);
    setInputText("");
  };

  const handleSend = () => {
    processUserMessage(inputText);
  };

  const handleSuggestionPress = async (suggestion: SafetySuggestionType) => {
    if (processingAction || hydratingStore) {
      if (hydratingStore) {
        appendAssistantMessage(["Loading safety data. Please try again in a moment."], []);
      }
      return;
    }

    setProcessingAction(true);
    try {
      if (suggestion === "fake_call") {
        const navigated = safeNavigate(navigation, "FakeCallScreen");
        if (!navigated) {
          appendAssistantMessage(["Something went wrong. Please try again."], []);
        }
        return;
      }

      if (suggestion === "safe_haven") {
        await safeHavenController.loadNearbySafeHavens();
        const navigated = safeNavigate(navigation, "SafeHavenScreen");
        if (!navigated) {
          appendAssistantMessage(["Something went wrong. Please try again."], []);
        }
        return;
      }

      if (suggestion === "share_location") {
        const result = await locationShareController.shareLocationWithTrustedContacts();
        if (!result.success || !result.mapLink) {
          appendAssistantMessage([result.error ?? "Location unavailable."], []);
          return;
        }

        appendAssistantMessage(
          ["My current location has been shared with your trusted contacts."],
          []
        );
        Alert.alert("My current location", result.mapLink, [{ text: "OK" }]);
        return;
      }

      if (suggestion === "protection_mode") {
        const result = await protectionController.activateProtectionMode();
        if (result.error) {
          appendAssistantMessage([result.error], []);
          return;
        }
        appendAssistantMessage(["Protection Mode activated."], []);
        safeNavigate(navigation, "ProtectionModeScreen");
        return;
      }

      if (suggestion === "trusted_contact") {
        const result = await protectionController.callPrimaryTrustedContact();
        if (!result.success) {
          appendAssistantMessage([result.error ?? "Unable to open dialer."], []);
          return;
        }
        appendAssistantMessage(
          [`Dialer opened for ${result.targetLabel || "trusted contact"}.`],
          []
        );
      }
    } catch {
      appendAssistantMessage(["Unable to complete that action right now."], []);
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <AppLayout title="Safety AI">
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatContainer}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <View
                key={message.id}
                style={[styles.messageWrap, isUser ? styles.userWrap : styles.assistantWrap]}
              >
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                  {message.lines.map((line, index) => (
                    <Text
                      key={`${message.id}_${index}`}
                      style={[styles.messageText, isUser && styles.userMessageText]}
                    >
                      {line}
                    </Text>
                  ))}
                </View>

                {!isUser && message.suggestions.length > 0 ? (
                  <View style={styles.suggestionRow}>
                    {message.suggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={`${message.id}_${suggestion}`}
                        style={styles.suggestionButton}
                        disabled={processingAction}
                        activeOpacity={0.7}
                        onPress={() => {
                          handleSuggestionPress(suggestion).catch(() => undefined);
                        }}
                      >
                        <Text style={styles.suggestionText}>{suggestionLabel[suggestion]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={inputText}
            onChangeText={(value) => {
              setInputText(value);
              if (inputValidationMessage && value.trim().length > 0) {
                setInputValidationMessage(null);
              }
            }}
            style={styles.input}
            placeholder="Describe what is happening..."
            placeholderTextColor={colors.textDark}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={processingAction}
            activeOpacity={0.7}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>

        {hydratingStore ? (
          <View style={styles.systemMessageWrap}>
            <Text style={styles.systemMessageText}>Loading saved safety data...</Text>
          </View>
        ) : null}

        <View style={styles.quickChipRow}>
          {quickPromptChips.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.quickChip}
              activeOpacity={0.7}
              onPress={() => processUserMessage(chip)}
            >
              <Text style={styles.quickChipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {inputValidationMessage ? (
          <View style={styles.systemMessageWrap}>
            <Text style={styles.systemMessageText}>{inputValidationMessage}</Text>
          </View>
        ) : null}

        {lastAssistantSuggestions.length === 0 ? (
          <View style={styles.footerHint}>
            <Text style={styles.footerHintText}>Try: follow, cab, hotel, drink, ATM, help</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  chatContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm
  },
  messageWrap: {
    gap: 8
  },
  userWrap: {
    alignItems: "flex-end"
  },
  assistantWrap: {
    alignItems: "flex-start"
  },
  bubble: {
    maxWidth: "90%",
    borderRadius: 16,
    padding: 12,
    gap: 6
  },
  userBubble: {
    backgroundColor: colors.primary
  },
  assistantBubble: {
    backgroundColor: "#F6F2F8"
  },
  messageText: {
    color: "#29104A",
    fontSize: 16,
    lineHeight: 20
  },
  userMessageText: {
    textAlign: "right",
    color: "#FFFFFF"
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "92%"
  },
  suggestionButton: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  suggestionText: {
    color: colors.textDark,
    fontWeight: "700"
  },
  inputBar: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    borderWidth: 1.2,
    borderColor: "#D8CFE0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#29104A",
    fontSize: 16
  },
  sendButton: {
    minHeight: 52,
    minWidth: 78,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14
  },
  sendText: {
    color: colors.textLight,
    fontWeight: "700"
  },
  systemMessageWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs
  },
  systemMessageText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700"
  },
  quickChipRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  quickChip: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  quickChipText: {
    color: "#29104A",
    fontWeight: "700",
    fontSize: 16
  },
  footerHint: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs
  },
  footerHintText: {
    color: colors.textDark,
    fontSize: 12
  }
});

