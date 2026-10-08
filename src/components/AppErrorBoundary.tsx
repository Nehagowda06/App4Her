import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, typography } from "../utils/theme";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Prevent full application crash during demos.
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>App4Her</Text>
        <Text style={styles.message}>Something went wrong. Please restart the app.</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.button}
          onPress={this.handleReset}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14
  },
  title: {
    ...typography.title,
    fontSize: 28
  },
  message: {
    ...typography.body,
    textAlign: "center"
  },
  button: {
    minHeight: 52,
    minWidth: 140,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  buttonText: {
    ...typography.button
  }
});
